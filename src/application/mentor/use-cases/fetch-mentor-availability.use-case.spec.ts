import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AvailabilityRules } from 'src/domain/entities/availability-rules.entity';
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
import type { AvailabilityRulesRepository } from 'src/domain/repositories/availability-rules.repository';
import type { AvailabilitySlotRepository } from 'src/domain/repositories/availability-slot.repository';
import type { MentorRepository } from 'src/domain/repositories/mentor.repository';
import { FetchMentorAvailabilityUseCase } from './fetch-mentor-availability.use-case';

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

function makeRules(mentorId: string): AvailabilityRules {
  return AvailabilityRules.create({ mentorId, days: [] });
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

function makeRulesRepo(): jest.Mocked<
  Pick<AvailabilityRulesRepository, 'findByMentorId'>
> {
  return { findByMentorId: jest.fn().mockResolvedValue(null) };
}

function makeDates(offsetDays = 1): { from: Date; to: Date } {
  const from = new Date('2026-06-01T00:00:00Z');
  const to = new Date(from.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return { from, to };
}

describe('FetchMentorAvailabilityUseCase', () => {
  let useCase: FetchMentorAvailabilityUseCase;
  let mentorRepo: ReturnType<typeof makeMentorRepo>;
  let slotRepo: ReturnType<typeof makeSlotRepo>;
  let rulesRepo: ReturnType<typeof makeRulesRepo>;

  beforeEach(() => {
    mentorRepo = makeMentorRepo();
    slotRepo = makeSlotRepo();
    rulesRepo = makeRulesRepo();
    useCase = new FetchMentorAvailabilityUseCase(
      mentorRepo as unknown as MentorRepository,
      slotRepo as unknown as AvailabilitySlotRepository,
      rulesRepo as unknown as AvailabilityRulesRepository,
    );
  });

  describe('date validation', () => {
    it('throws BadRequestException when from equals to', async () => {
      const date = new Date('2026-06-01T00:00:00Z');

      await expect(
        useCase.execute('mentor-id', { from: date, to: date }),
      ).rejects.toThrow(BadRequestException);
      expect(mentorRepo.findByIdWithProfile).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when from is after to', async () => {
      const from = new Date('2026-06-10T00:00:00Z');
      const to = new Date('2026-06-01T00:00:00Z');

      await expect(useCase.execute('mentor-id', { from, to })).rejects.toThrow(
        BadRequestException,
      );
      expect(mentorRepo.findByIdWithProfile).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when range exceeds 31 days', async () => {
      const { from, to } = makeDates(32);

      await expect(useCase.execute('mentor-id', { from, to })).rejects.toThrow(
        BadRequestException,
      );
      expect(mentorRepo.findByIdWithProfile).not.toHaveBeenCalled();
    });

    it('accepts exactly 31-day range', async () => {
      const { from, to } = makeDates(31);
      mentorRepo.findByIdWithProfile.mockResolvedValue({
        user: makeUser(),
        mentorProfile: makeMentorProfile(),
      });

      await expect(
        useCase.execute('mentor-id', { from, to }),
      ).resolves.not.toThrow();
    });

    it('validates date range before checking mentor existence', async () => {
      const date = new Date('2026-06-01T00:00:00Z');

      await expect(
        useCase.execute('any-id', { from: date, to: date }),
      ).rejects.toThrow(BadRequestException);

      expect(mentorRepo.findByIdWithProfile).not.toHaveBeenCalled();
    });
  });

  describe('mentor existence', () => {
    it('throws NotFoundException when mentor not found', async () => {
      mentorRepo.findByIdWithProfile.mockResolvedValue(null);
      const { from, to } = makeDates(7);

      await expect(useCase.execute('missing-id', { from, to })).rejects.toThrow(
        NotFoundException,
      );
      expect(slotRepo.findByMentorId).not.toHaveBeenCalled();
      expect(rulesRepo.findByMentorId).not.toHaveBeenCalled();
    });
  });

  describe('successful fetch', () => {
    let user: User;

    beforeEach(() => {
      user = makeUser();
      mentorRepo.findByIdWithProfile.mockResolvedValue({
        user,
        mentorProfile: makeMentorProfile(),
      });
    });

    it('returns slots and rules', async () => {
      const { from, to } = makeDates(7);
      const slot = makeSlot(user.id.toString());
      const rules = makeRules(user.id.toString());

      slotRepo.findByMentorId.mockResolvedValue([slot]);
      rulesRepo.findByMentorId.mockResolvedValue(rules);

      const result = await useCase.execute(user.id.toString(), { from, to });

      expect(result.slots).toEqual([slot]);
      expect(result.rules).toBe(rules);
    });

    it('returns null rules when mentor has none', async () => {
      const { from, to } = makeDates(7);
      rulesRepo.findByMentorId.mockResolvedValue(null);

      const result = await useCase.execute(user.id.toString(), { from, to });

      expect(result.rules).toBeNull();
    });

    it('queries slots and rules in parallel with correct mentorId and range', async () => {
      const { from, to } = makeDates(7);
      const mentorId = user.id.toString();

      await useCase.execute(mentorId, { from, to });

      expect(slotRepo.findByMentorId).toHaveBeenCalledWith(mentorId, {
        from,
        to,
      });
      expect(rulesRepo.findByMentorId).toHaveBeenCalledWith(mentorId);
    });
  });
});
