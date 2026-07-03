import { NotFoundException } from '@nestjs/common';
import {
  AvailabilitySlot,
  AvailabilitySlotType,
} from 'src/domain/entities/availability-slot.entity';
import {
  MentorProfile,
  MentorProfileProps,
} from 'src/domain/entities/mentor-profile.entity';
import {
  ActivityStatus,
  User,
  UserProps,
  UserRole,
} from 'src/domain/entities/user.entity';
import type { AvailabilitySlotRepository } from 'src/domain/repositories/availability-slot.repository';
import type {
  MentorListItem,
  MentorRepository,
} from 'src/domain/repositories/mentor.repository';
import { FetchMentorByIdUseCase } from './fetch-mentor-by-id.use-case';

function makeUser(overrides?: Partial<UserProps>): User {
  return User.create({
    name: 'Mentor',
    email: 'mentor@example.com',
    role: UserRole.MENTOR,
    activityStatus: ActivityStatus.ACTIVE,
    links: [],
    deletedAt: null,
    ...overrides,
  });
}

function makeMentorProfile(
  overrides?: Partial<MentorProfileProps>,
): MentorProfile {
  return MentorProfile.create({
    niche: 'Backend',
    specialties: ['NestJS'],
    chatPrice: null,
    hourPrice: 100,
    ...overrides,
  });
}

function makeSlot(mentorId: string): AvailabilitySlot {
  const now = new Date();
  return AvailabilitySlot.create({
    mentorId,
    startTime: now,
    endTime: new Date(now.getTime() + 60 * 60 * 1000),
    type: AvailabilitySlotType.ADD,
    ruleId: null,
  });
}

function makeMentorRepo(): jest.Mocked<
  Pick<MentorRepository, 'findByIdWithProfile'>
> {
  return { findByIdWithProfile: jest.fn() };
}

function makeSlotRepo(): jest.Mocked<
  Pick<AvailabilitySlotRepository, 'findByMentorId'>
> {
  return { findByMentorId: jest.fn().mockResolvedValue([]) };
}

describe('FetchMentorByIdUseCase', () => {
  let useCase: FetchMentorByIdUseCase;
  let mentorRepo: ReturnType<typeof makeMentorRepo>;
  let slotRepo: ReturnType<typeof makeSlotRepo>;

  beforeEach(() => {
    mentorRepo = makeMentorRepo();
    slotRepo = makeSlotRepo();
    useCase = new FetchMentorByIdUseCase(
      mentorRepo as unknown as MentorRepository,
      slotRepo as unknown as AvailabilitySlotRepository,
    );
  });

  it('throws NotFoundException when mentor not found', async () => {
    mentorRepo.findByIdWithProfile.mockResolvedValue(null);

    await expect(useCase.execute('missing-id')).rejects.toThrow(
      NotFoundException,
    );
    expect(slotRepo.findByMentorId).not.toHaveBeenCalled();
  });

  it('returns mentor data with availability preview', async () => {
    const user = makeUser();
    const mentorProfile = makeMentorProfile();
    const item: MentorListItem = { user, mentorProfile };
    const slot = makeSlot(user.id.toString());

    mentorRepo.findByIdWithProfile.mockResolvedValue(item);
    slotRepo.findByMentorId.mockResolvedValue([slot]);

    const result = await useCase.execute(user.id.toString());

    expect(result.user).toBe(user);
    expect(result.mentorProfile).toBe(mentorProfile);
    expect(result.availabilityPreview).toEqual([slot]);
  });

  it('queries availability preview for next 7 days from now', async () => {
    const user = makeUser();
    mentorRepo.findByIdWithProfile.mockResolvedValue({
      user,
      mentorProfile: makeMentorProfile(),
    });

    const before = Date.now();
    await useCase.execute(user.id.toString());
    const after = Date.now();

    const [, options] = slotRepo.findByMentorId.mock.calls[0];
    const fromMs = options!.from.getTime();
    const toMs = options!.to.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(fromMs).toBeGreaterThanOrEqual(before);
    expect(fromMs).toBeLessThanOrEqual(after);
    expect(toMs - fromMs).toBeCloseTo(sevenDaysMs, -3);
  });

  it('returns empty availabilityPreview when no slots exist', async () => {
    const user = makeUser();
    mentorRepo.findByIdWithProfile.mockResolvedValue({
      user,
      mentorProfile: makeMentorProfile(),
    });
    slotRepo.findByMentorId.mockResolvedValue([]);

    const result = await useCase.execute(user.id.toString());

    expect(result.availabilityPreview).toEqual([]);
  });

  it('queries slots using the mentor id from params', async () => {
    const user = makeUser();
    const mentorId = user.id.toString();
    mentorRepo.findByIdWithProfile.mockResolvedValue({
      user,
      mentorProfile: makeMentorProfile(),
    });

    await useCase.execute(mentorId);

    expect(slotRepo.findByMentorId).toHaveBeenCalledWith(
      mentorId,
      expect.any(Object),
    );
  });
});
