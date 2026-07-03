import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AvailabilityRulesRepository } from 'src/domain/repositories/availability-rules.repository';
import type { AvailabilitySlotRepository } from 'src/domain/repositories/availability-slot.repository';
import type { MentorRepository } from 'src/domain/repositories/mentor.repository';
import {
  AVAILABILITY_RULES_REPOSITORY,
  AVAILABILITY_SLOT_REPOSITORY,
  MENTOR_REPOSITORY,
} from 'src/domain/repositories/tokens';
import { FetchAvailabilitySlotDto } from 'src/application/availability/dtos/fetch-availabity.dto';

@Injectable()
export class FetchMentorAvailabilityUseCase {
  private static readonly MAX_RANGE_DAYS = 31;
  private static readonly MAX_RANGE_MS =
    FetchMentorAvailabilityUseCase.MAX_RANGE_DAYS * 24 * 60 * 60 * 1000;

  constructor(
    @Inject(MENTOR_REPOSITORY)
    private readonly mentorRepository: MentorRepository,
    @Inject(AVAILABILITY_SLOT_REPOSITORY)
    private readonly availabilitySlotRepository: AvailabilitySlotRepository,
    @Inject(AVAILABILITY_RULES_REPOSITORY)
    private readonly availabilityRulesRepository: AvailabilityRulesRepository,
  ) {}

  async execute(mentorId: string, filters: FetchAvailabilitySlotDto) {
    const fromMs = filters.from.getTime();
    const toMs = filters.to.getTime();

    if (fromMs >= toMs) {
      throw new BadRequestException('The filter "from" must be before "to".');
    }

    if (toMs - fromMs > FetchMentorAvailabilityUseCase.MAX_RANGE_MS) {
      throw new BadRequestException(
        `Range must be at most ${FetchMentorAvailabilityUseCase.MAX_RANGE_DAYS} days.`,
      );
    }

    const mentor = await this.mentorRepository.findByIdWithProfile(mentorId);

    if (!mentor) {
      throw new NotFoundException('Mentor not found.');
    }

    const [slots, rules] = await Promise.all([
      this.availabilitySlotRepository.findByMentorId(mentorId, {
        from: filters.from,
        to: filters.to,
      }),
      this.availabilityRulesRepository.findByMentorId(mentorId),
    ]);

    return { slots, rules };
  }
}
