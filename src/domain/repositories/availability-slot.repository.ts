import {
  AvailabilitySlot,
  AvailabilitySlotProps,
} from '../entities/availability-slot.entity';

export type CreateAvalabilitySlotInput = AvailabilitySlotProps;

export interface AvailabilitySlotRepository {
  findById(id: string): Promise<AvailabilitySlot | null>;
  findByMentorId(
    mentorId: string,
    options?: {
      from: Date;
      to: Date;
    },
  ): Promise<AvailabilitySlot[]>;
  deleteById(id: string): Promise<void>;
  create(input: CreateAvalabilitySlotInput): Promise<AvailabilitySlot>;
}
