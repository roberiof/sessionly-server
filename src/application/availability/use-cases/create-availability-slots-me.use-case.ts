import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AvailabilitySlot,
  AvailabilitySlotType,
} from 'src/domain/entities/availability-slot.entity';
import type { AvailabilityRulesRepository } from 'src/domain/repositories/availability-rules.repository';
import type { AvailabilitySlotRepository } from 'src/domain/repositories/availability-slot.repository';
import {
  AVAILABILITY_RULES_REPOSITORY,
  AVAILABILITY_SLOT_REPOSITORY,
} from 'src/domain/repositories/tokens';
import { CreateAvailabilitySlotDto } from '../dtos/create-availability-slot.dto';

const MIN_LEAD_MINUTES = 15;
const MAX_DURATION_HOURS = 8;
const MS_PER_MIN = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MIN;

@Injectable()
export class CreateAvailabilitySlotsMeUseCase {
  constructor(
    @Inject(AVAILABILITY_SLOT_REPOSITORY)
    private readonly availabilityRepository: AvailabilitySlotRepository,
    @Inject(AVAILABILITY_RULES_REPOSITORY)
    private readonly availabilityRulesRepository: AvailabilityRulesRepository,
  ) {}

  async execute(
    mentorId: string,
    input: CreateAvailabilitySlotDto,
  ): Promise<AvailabilitySlot> {
    const { startTime, endTime, type, ruleId } = input;

    if (startTime.getTime() >= endTime.getTime()) {
      throw new BadRequestException('startTime must be before endTime.');
    }

    if (startTime.getTime() < Date.now() + MIN_LEAD_MINUTES * MS_PER_MIN) {
      throw new BadRequestException(
        `startTime must be at least ${MIN_LEAD_MINUTES} minutes in the future.`,
      );
    }

    if (
      endTime.getTime() - startTime.getTime() >
      MAX_DURATION_HOURS * MS_PER_HOUR
    ) {
      throw new BadRequestException(
        `Slot duration must not exceed ${MAX_DURATION_HOURS} hours.`,
      );
    }

    if (type === AvailabilitySlotType.BLOCK && !ruleId) {
      throw new BadRequestException('ruleId is required when type is BLOCK.');
    }

    if (type !== AvailabilitySlotType.BLOCK && ruleId) {
      throw new BadRequestException(
        'ruleId can only be set when type is BLOCK.',
      );
    }

    if (type === AvailabilitySlotType.BLOCK && ruleId) {
      const rule =
        await this.availabilityRulesRepository.findByMentorId(mentorId);

      if (!rule || rule.id.toString() !== ruleId) {
        throw new NotFoundException(
          'Availability rule not found for this mentor.',
        );
      }

      this.assertSlotWithinRuleWindow(startTime, endTime, rule.days);
    }

    const overlapping = await this.availabilityRepository.findByMentorId(
      mentorId,
      { from: startTime, to: endTime },
    );

    if (overlapping.length > 0) {
      throw new BadRequestException(
        'Slot overlaps with an existing availability slot.',
      );
    }

    return this.availabilityRepository.create({
      mentorId,
      startTime,
      endTime,
      type,
      ruleId: ruleId ?? null,
    });
  }

  // NOTE: validates against UTC weekday/HH:mm. Once mentor timezone lands on
  // MentorProfile, convert (startTime, endTime) into mentor TZ before comparing.
  private assertSlotWithinRuleWindow(
    startTime: Date,
    endTime: Date,
    days: {
      weekday: number;
      timeRanges: { startTime: string; endTime: string }[];
    }[],
  ): void {
    if (startTime.getUTCDate() !== endTime.getUTCDate()) {
      throw new BadRequestException(
        'BLOCK slot must start and end on the same UTC day.',
      );
    }

    const weekday = startTime.getUTCDay();
    const startMin = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
    const endMin = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();

    const dayRule = days.find((d) => d.weekday === weekday);
    if (!dayRule) {
      throw new BadRequestException(
        `BLOCK slot weekday ${weekday} has no matching rule.`,
      );
    }

    const inside = dayRule.timeRanges.some((r) => {
      const rStart = this.toMinutes(r.startTime);
      const rEnd = this.toMinutes(r.endTime);
      return startMin >= rStart && endMin <= rEnd;
    });

    if (!inside) {
      throw new BadRequestException(
        'BLOCK slot must fall inside an existing rule time range.',
      );
    }
  }

  private toMinutes(hhmm: string): number {
    const h = (hhmm.charCodeAt(0) - 48) * 10 + (hhmm.charCodeAt(1) - 48);
    const m = (hhmm.charCodeAt(3) - 48) * 10 + (hhmm.charCodeAt(4) - 48);
    return h * 60 + m;
  }
}
