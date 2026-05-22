import { BadRequestException } from '@nestjs/common';
import { AvailabilityRules } from 'src/domain/entities/availability-rules.entity';
import type { AvailabilityRulesRepository } from 'src/domain/repositories/availability-rules.repository';
import { UpdateAvailabilityRulesMeUseCase } from '../update-availability-rules-me.use-case';

function makeRepo(): jest.Mocked<
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

describe('UpdateAvailabilityRulesMeUseCase', () => {
  let useCase: UpdateAvailabilityRulesMeUseCase;
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new UpdateAvailabilityRulesMeUseCase(repo);
  });

  it('upserts rules with the given days', async () => {
    const result = AvailabilityRules.create({
      mentorId: MENTOR_ID,
      days: [
        { weekday: 1, timeRanges: [{ startTime: '09:00', endTime: '12:00' }] },
      ],
    });
    repo.upsertByMentorId.mockResolvedValue(result);

    const out = await useCase.execute(MENTOR_ID, {
      days: [
        { weekday: 1, timeRanges: [{ startTime: '09:00', endTime: '12:00' }] },
      ],
    });

    expect(repo.upsertByMentorId).toHaveBeenCalledWith({
      mentorId: MENTOR_ID,
      days: [
        { weekday: 1, timeRanges: [{ startTime: '09:00', endTime: '12:00' }] },
      ],
    });
    expect(out).toBe(result);
  });

  it('rejects duplicate weekdays', async () => {
    await expect(
      useCase.execute(MENTOR_ID, {
        days: [
          {
            weekday: 1,
            timeRanges: [{ startTime: '09:00', endTime: '10:00' }],
          },
          {
            weekday: 1,
            timeRanges: [{ startTime: '11:00', endTime: '12:00' }],
          },
        ],
      }),
    ).rejects.toThrow(/Duplicate weekday/);
    expect(repo.upsertByMentorId).not.toHaveBeenCalled();
  });

  it('rejects when startTime >= endTime in a range', async () => {
    await expect(
      useCase.execute(MENTOR_ID, {
        days: [
          {
            weekday: 1,
            timeRanges: [{ startTime: '12:00', endTime: '12:00' }],
          },
        ],
      }),
    ).rejects.toThrow(/endTime must be after startTime/);
  });

  it('rejects overlapping ranges within a weekday', async () => {
    await expect(
      useCase.execute(MENTOR_ID, {
        days: [
          {
            weekday: 1,
            timeRanges: [
              { startTime: '09:00', endTime: '11:00' },
              { startTime: '10:30', endTime: '12:00' },
            ],
          },
        ],
      }),
    ).rejects.toThrow(/Overlapping time ranges/);
  });

  it('accepts adjacent non-overlapping ranges', async () => {
    repo.upsertByMentorId.mockResolvedValue(
      AvailabilityRules.create({ mentorId: MENTOR_ID, days: [] }),
    );

    await useCase.execute(MENTOR_ID, {
      days: [
        {
          weekday: 1,
          timeRanges: [
            { startTime: '09:00', endTime: '10:00' },
            { startTime: '10:00', endTime: '11:00' },
          ],
        },
      ],
    });

    expect(repo.upsertByMentorId).toHaveBeenCalled();
  });

  it('throws BadRequestException on invalid input', async () => {
    await expect(
      useCase.execute(MENTOR_ID, {
        days: [
          {
            weekday: 1,
            timeRanges: [{ startTime: '13:00', endTime: '12:00' }],
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
