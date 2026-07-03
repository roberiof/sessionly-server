import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { AVAILABILITY_SLOT_REPOSITORY } from 'src/domain/repositories';
import type { AvailabilitySlotRepository } from 'src/domain/repositories/availability-slot.repository';

export class DeleteAvailabilitySlotsMeUseCase {
  constructor(
    @Inject(AVAILABILITY_SLOT_REPOSITORY)
    private readonly availabilityRepository: AvailabilitySlotRepository,
  ) {}

  async execute(id: string, mentorId: string): Promise<void> {
    const slot = await this.availabilityRepository.findById(id);

    if (!slot) {
      throw new NotFoundException('Availability slot not found.');
    }

    if (slot.mentorId !== mentorId) {
      throw new ForbiddenException('Forbidden.');
    }

    // TODO: reject when a BookingRequest references this slot. Implement once
    // the BookingRequest module lands. Per docs §4 — DELETE /availability/slots/:slotId.

    await this.availabilityRepository.deleteById(id);
  }
}
