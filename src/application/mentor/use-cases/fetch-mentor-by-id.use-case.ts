import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AvailabilitySlot } from 'src/domain/entities/availability-slot.entity';
import type { MentorListItem } from 'src/domain/repositories/mentor.repository';
import type { AvailabilitySlotRepository } from 'src/domain/repositories/availability-slot.repository';
import type { MentorRepository } from 'src/domain/repositories/mentor.repository';
import {
  AVAILABILITY_SLOT_REPOSITORY,
  MENTOR_REPOSITORY,
} from 'src/domain/repositories/tokens';

export type FetchMentorByIdResult = MentorListItem & {
  availabilityPreview: AvailabilitySlot[];
};

@Injectable()
export class FetchMentorByIdUseCase {
  constructor(
    @Inject(MENTOR_REPOSITORY)
    private readonly mentorRepository: MentorRepository,
    @Inject(AVAILABILITY_SLOT_REPOSITORY)
    private readonly availabilitySlotRepository: AvailabilitySlotRepository,
  ) {}

  async execute(id: string): Promise<FetchMentorByIdResult> {
    const mentor = await this.mentorRepository.findByIdWithProfile(id);

    if (!mentor) {
      throw new NotFoundException('Mentor not found.');
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const availabilityPreview =
      await this.availabilitySlotRepository.findByMentorId(id, {
        from: now,
        to: sevenDaysFromNow,
      });

    return { ...mentor, availabilityPreview };
  }
}
