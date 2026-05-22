import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AVAILABILITY_RULES_REPOSITORY } from 'src/domain/repositories';
import type { AvailabilityRulesRepository } from 'src/domain/repositories/availability-rules.repository';
import {
  AvailabilityDayDto,
  UpdateAvailabilityRulesDto,
} from '../dtos/update-availability-rules.dto';
import { AvailabilityRules } from 'src/domain/entities/availability-rules.entity';

@Injectable()
export class UpdateAvailabilityRulesMeUseCase {
  constructor(
    @Inject(AVAILABILITY_RULES_REPOSITORY)
    private readonly availabilityRulesRepository: AvailabilityRulesRepository,
  ) {}

  private validateDays(days: AvailabilityDayDto[]): void {
    const MINUTES_PER_DAY = 24 * 60;
    const seenWeekdays = new Uint8Array(7);

    for (const day of days) {
      if (seenWeekdays[day.weekday]) {
        throw new BadRequestException(`Duplicate weekday ${day.weekday}.`);
      }
      seenWeekdays[day.weekday] = 1;

      const occupied = new Uint8Array(MINUTES_PER_DAY);

      for (const range of day.timeRanges) {
        const start = this.toMinutes(range.startTime);
        const end = this.toMinutes(range.endTime);

        if (start >= end) {
          throw new BadRequestException(
            `endTime must be after startTime on weekday ${day.weekday}.`,
          );
        }

        for (let m = start; m < end; m++) {
          if (occupied[m]) {
            throw new BadRequestException(
              `Overlapping time ranges on weekday ${day.weekday}.`,
            );
          }
          occupied[m] = 1;
        }
      }
    }
  }

  private toMinutes(hhmm: string): number {
    const h = (hhmm.charCodeAt(0) - 48) * 10 + (hhmm.charCodeAt(1) - 48);
    const m = (hhmm.charCodeAt(3) - 48) * 10 + (hhmm.charCodeAt(4) - 48);
    return h * 60 + m;
  }

  async execute(
    mentorId: string,
    rules: UpdateAvailabilityRulesDto,
  ): Promise<AvailabilityRules> {
    this.validateDays(rules.days);

    return this.availabilityRulesRepository.upsertByMentorId({
      mentorId,
      days: rules.days,
    });
  }
}
