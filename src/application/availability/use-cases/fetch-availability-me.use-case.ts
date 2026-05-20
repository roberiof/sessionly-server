import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { AvailabilitySlotRepository } from 'src/domain/repositories/availability-slot.repository';
import {
  AVAILABILITY_SLOT_REPOSITORY,
  AVAILABILITY_RULES_REPOSITORY,
} from 'src/domain/repositories';
import type { AvailabilityRulesRepository } from 'src/domain/repositories/availability-rules.repository';
import { FetchAvailabilitySlotDto } from '../dtos/fetch-availabity.dto';

@Injectable()
export class FetchAvailabilityMeUseCase {
  constructor(
    @Inject(AVAILABILITY_SLOT_REPOSITORY)
    private readonly availabilityRepository: AvailabilitySlotRepository,
    @Inject(AVAILABILITY_RULES_REPOSITORY)
    private readonly availabilityRulesRepository: AvailabilityRulesRepository,
  ) {}

  private static readonly MAX_RANGE_DAYS = 31;
  private static readonly MAX_RANGE_MS =
    FetchAvailabilityMeUseCase.MAX_RANGE_DAYS * 24 * 60 * 60 * 1000;

  private validateFilters(filters: FetchAvailabilitySlotDto): void {
    const fromMs = filters.from.getTime();
    const toMs = filters.to.getTime();

    if (fromMs >= toMs) {
      throw new BadRequestException('The filter "from" must be before "to".');
    }

    if (toMs - fromMs > FetchAvailabilityMeUseCase.MAX_RANGE_MS) {
      throw new BadRequestException(
        `Range must be at most ${FetchAvailabilityMeUseCase.MAX_RANGE_DAYS} days.`,
      );
    }
  }

  async execute(mentorId: string, filters: FetchAvailabilitySlotDto) {
    this.validateFilters(filters);

    const [slots, rules] = await Promise.all([
      this.availabilityRepository.findByMentorId(mentorId, {
        from: filters.from,
        to: filters.to,
      }),
      this.availabilityRulesRepository.findByMentorId(mentorId),
    ]);

    return {
      slots,
      rules,
    };
  }
}
