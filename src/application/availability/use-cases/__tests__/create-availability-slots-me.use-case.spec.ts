import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UniqueEntityID } from 'src/core/entities/unique-entity-id';
import { AvailabilityRules } from 'src/domain/entities/availability-rules.entity';
import {
  AvailabilitySlot,
  AvailabilitySlotType,
} from 'src/domain/entities/availability-slot.entity';
import type { AvailabilityRulesRepository } from 'src/domain/repositories/availability-rules.repository';
import type { AvailabilitySlotRepository } from 'src/domain/repositories/availability-slot.repository';
import { CreateAvailabilitySlotsMeUseCase } from '../create-availability-slots-me.use-case';

function makeSlotRepo(): jest.Mocked<
  Pick<
    AvailabilitySlotRepository,
    'create' | 'findById' | 'findByMentorId' | 'deleteById'
  >
> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByMentorId: jest.fn().mockResolvedValue([]),
    deleteById: jest.fn(),
  };
}

function makeRulesRepo(): jest.Mocked<
  Pick<
    AvailabilityRulesRepository,
    'findByMentorId' | 'create' | 'updateByMentorId' | 'upsertByMentorId'
  >
> {
  return {
    findByMentorId: jest.fn(),
    create: jest.fn(),
    updateByMentorId: jest.fn(),
    upsertByMentorId: jest.fn(),
  };
}

const MENTOR_ID = 'mentor-1';
const RULE_ID = 'rule-1';

function futureDates(offsetHoursFromNow = 2) {
  // Pick a Monday at 10:00 UTC well in the future to land inside the rule window.
  const base = new Date();
  const start = new Date(
    Date.UTC(
      base.getUTCFullYear() + 1,
      0,
      4, // 2027-01-04 is a Monday
      10,
      0,
      0,
    ),
  );
  void offsetHoursFromNow;
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { startTime: start, endTime: end };
}

function makeRule(): AvailabilityRules {
  return AvailabilityRules.create({
    mentorId: MENTOR_ID,
    days: [
      {
        weekday: 1, // Monday
        timeRanges: [{ startTime: '09:00', endTime: '12:00' }],
      },
    ],
    id: new UniqueEntityID(RULE_ID),
  });
}

describe('CreateAvailabilitySlotsMeUseCase', () => {
  let useCase: CreateAvailabilitySlotsMeUseCase;
  let slotRepo: ReturnType<typeof makeSlotRepo>;
  let rulesRepo: ReturnType<typeof makeRulesRepo>;

  beforeEach(() => {
    slotRepo = makeSlotRepo();
    rulesRepo = makeRulesRepo();
    useCase = new CreateAvailabilitySlotsMeUseCase(slotRepo, rulesRepo);
  });

  it('creates an ADD slot successfully', async () => {
    const { startTime, endTime } = futureDates();
    const created = AvailabilitySlot.create({
      mentorId: MENTOR_ID,
      startTime,
      endTime,
      type: AvailabilitySlotType.ADD,
      ruleId: null,
    });
    slotRepo.create.mockResolvedValue(created);

    const result = await useCase.execute(MENTOR_ID, {
      startTime,
      endTime,
      type: AvailabilitySlotType.ADD,
    });

    expect(slotRepo.create).toHaveBeenCalledWith({
      mentorId: MENTOR_ID,
      startTime,
      endTime,
      type: AvailabilitySlotType.ADD,
      ruleId: null,
    });
    expect(result).toBe(created);
  });

  it('throws when startTime is not before endTime', async () => {
    const { startTime } = futureDates();
    await expect(
      useCase.execute(MENTOR_ID, {
        startTime,
        endTime: startTime,
        type: AvailabilitySlotType.ADD,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(slotRepo.create).not.toHaveBeenCalled();
  });

  it('throws when startTime is within the min lead window', async () => {
    const startTime = new Date(Date.now() + 60 * 1000); // 1 min ahead
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    await expect(
      useCase.execute(MENTOR_ID, {
        startTime,
        endTime,
        type: AvailabilitySlotType.ADD,
      }),
    ).rejects.toThrow(/minutes in the future/);
    expect(slotRepo.create).not.toHaveBeenCalled();
  });

  it('throws when slot duration exceeds the max', async () => {
    const { startTime } = futureDates();
    const endTime = new Date(startTime.getTime() + 9 * 60 * 60 * 1000);
    await expect(
      useCase.execute(MENTOR_ID, {
        startTime,
        endTime,
        type: AvailabilitySlotType.ADD,
      }),
    ).rejects.toThrow(/duration must not exceed/);
    expect(slotRepo.create).not.toHaveBeenCalled();
  });

  it('throws when BLOCK has no ruleId', async () => {
    const { startTime, endTime } = futureDates();
    await expect(
      useCase.execute(MENTOR_ID, {
        startTime,
        endTime,
        type: AvailabilitySlotType.BLOCK,
      }),
    ).rejects.toThrow(/ruleId is required/);
    expect(slotRepo.create).not.toHaveBeenCalled();
  });

  it('throws when ADD includes a ruleId', async () => {
    const { startTime, endTime } = futureDates();
    await expect(
      useCase.execute(MENTOR_ID, {
        startTime,
        endTime,
        type: AvailabilitySlotType.ADD,
        ruleId: RULE_ID,
      }),
    ).rejects.toThrow(/ruleId can only be set when type is BLOCK/);
  });

  it('throws when BLOCK ruleId does not belong to the mentor', async () => {
    const { startTime, endTime } = futureDates();
    rulesRepo.findByMentorId.mockResolvedValue(makeRule());

    await expect(
      useCase.execute(MENTOR_ID, {
        startTime,
        endTime,
        type: AvailabilitySlotType.BLOCK,
        ruleId: 'someone-else-rule',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(slotRepo.create).not.toHaveBeenCalled();
  });

  it('throws when BLOCK slot falls outside the rule window', async () => {
    const { startTime } = futureDates();
    // outside 09:00-12:00: 13:00-14:00
    const outsideStart = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);
    const outsideEnd = new Date(outsideStart.getTime() + 60 * 60 * 1000);
    rulesRepo.findByMentorId.mockResolvedValue(makeRule());

    await expect(
      useCase.execute(MENTOR_ID, {
        startTime: outsideStart,
        endTime: outsideEnd,
        type: AvailabilitySlotType.BLOCK,
        ruleId: RULE_ID,
      }),
    ).rejects.toThrow(/inside an existing rule time range/);
  });

  it('creates a BLOCK slot when ruleId and window are valid', async () => {
    const { startTime, endTime } = futureDates();
    rulesRepo.findByMentorId.mockResolvedValue(makeRule());
    const created = AvailabilitySlot.create({
      mentorId: MENTOR_ID,
      startTime,
      endTime,
      type: AvailabilitySlotType.BLOCK,
      ruleId: RULE_ID,
    });
    slotRepo.create.mockResolvedValue(created);

    const result = await useCase.execute(MENTOR_ID, {
      startTime,
      endTime,
      type: AvailabilitySlotType.BLOCK,
      ruleId: RULE_ID,
    });

    expect(result).toBe(created);
    expect(slotRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ ruleId: RULE_ID }),
    );
  });

  it('throws when slot overlaps an existing slot', async () => {
    const { startTime, endTime } = futureDates();
    slotRepo.findByMentorId.mockResolvedValue([
      AvailabilitySlot.create({
        mentorId: MENTOR_ID,
        startTime,
        endTime,
        type: AvailabilitySlotType.ADD,
        ruleId: null,
      }),
    ]);

    await expect(
      useCase.execute(MENTOR_ID, {
        startTime,
        endTime,
        type: AvailabilitySlotType.ADD,
      }),
    ).rejects.toThrow(/overlaps/);
    expect(slotRepo.create).not.toHaveBeenCalled();
  });
});
