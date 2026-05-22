import { BadRequestException } from '@nestjs/common';
import { AvailabilityRules } from 'src/domain/entities/availability-rules.entity';
import {
  AvailabilitySlot,
  AvailabilitySlotType,
} from 'src/domain/entities/availability-slot.entity';
import type { AvailabilityRulesRepository } from 'src/domain/repositories/availability-rules.repository';
import type { AvailabilitySlotRepository } from 'src/domain/repositories/availability-slot.repository';
import { FetchAvailabilityMeUseCase } from '../fetch-availability-me.use-case';

function makeSlotRepo(): jest.Mocked<
  Pick<
    AvailabilitySlotRepository,
    'findByMentorId' | 'findById' | 'create' | 'deleteById'
  >
> {
  return {
    findByMentorId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    deleteById: jest.fn(),
  };
}

function makeRulesRepo(): jest.Mocked<
  Pick<
    AvailabilityRulesRepository,
    'findByMentorId' | 'create' | 'updateByMentorId'
  >
> {
  return {
    findByMentorId: jest.fn(),
    create: jest.fn(),
    updateByMentorId: jest.fn(),
  };
}

const MENTOR_ID = 'mentor-1';
const DAY_MS = 24 * 60 * 60 * 1000;

describe('FetchAvailabilityMeUseCase', () => {
  let useCase: FetchAvailabilityMeUseCase;
  let slotRepo: ReturnType<typeof makeSlotRepo>;
  let rulesRepo: ReturnType<typeof makeRulesRepo>;

  beforeEach(() => {
    slotRepo = makeSlotRepo();
    rulesRepo = makeRulesRepo();
    useCase = new FetchAvailabilityMeUseCase(
      slotRepo,
      rulesRepo as unknown as AvailabilityRulesRepository,
    );
  });

  it('returns slots and rules for valid range', async () => {
    const from = new Date();
    const to = new Date(from.getTime() + 7 * DAY_MS);
    const slot = AvailabilitySlot.create({
      mentorId: MENTOR_ID,
      startTime: from,
      endTime: new Date(from.getTime() + 60 * 60 * 1000),
      type: AvailabilitySlotType.ADD,
      ruleId: null,
    });
    const rules = AvailabilityRules.create({ mentorId: MENTOR_ID, days: [] });
    slotRepo.findByMentorId.mockResolvedValue([slot]);
    rulesRepo.findByMentorId.mockResolvedValue(rules);

    const result = await useCase.execute(MENTOR_ID, { from, to });

    expect(result.slots).toEqual([slot]);
    expect(result.rules).toBe(rules);
    expect(slotRepo.findByMentorId).toHaveBeenCalledWith(MENTOR_ID, {
      from,
      to,
    });
  });

  it('throws when from >= to', async () => {
    const now = new Date();
    await expect(
      useCase.execute(MENTOR_ID, { from: now, to: now }),
    ).rejects.toThrow(BadRequestException);
    expect(slotRepo.findByMentorId).not.toHaveBeenCalled();
  });

  it('throws when range exceeds 31 days', async () => {
    const from = new Date();
    const to = new Date(from.getTime() + 32 * DAY_MS);

    await expect(useCase.execute(MENTOR_ID, { from, to })).rejects.toThrow(
      /31 days/,
    );
    expect(slotRepo.findByMentorId).not.toHaveBeenCalled();
  });

  it('accepts exactly 31 days', async () => {
    const from = new Date();
    const to = new Date(from.getTime() + 31 * DAY_MS);
    slotRepo.findByMentorId.mockResolvedValue([]);
    rulesRepo.findByMentorId.mockResolvedValue(null);

    const result = await useCase.execute(MENTOR_ID, { from, to });

    expect(result.slots).toEqual([]);
    expect(result.rules).toBeNull();
  });

  it('returns null rules when none exist', async () => {
    const from = new Date();
    const to = new Date(from.getTime() + DAY_MS);
    slotRepo.findByMentorId.mockResolvedValue([]);
    rulesRepo.findByMentorId.mockResolvedValue(null);

    const result = await useCase.execute(MENTOR_ID, { from, to });

    expect(result.rules).toBeNull();
  });
});
