import { Injectable } from '@nestjs/common';
import type { AvailabilitySlot as PrismaAvailabilitySlot } from 'generated/prisma/client';
import { UniqueEntityID } from 'src/core/entities/unique-entity-id';
import { Mapper } from 'src/core/mappers/mapper';
import {
  AvailabilitySlot,
  AvailabilitySlotProps,
  AvailabilitySlotType,
} from 'src/domain/entities/availability-slot.entity';

@Injectable()
export class AvailabilitySlotMapper extends Mapper<
  AvailabilitySlot,
  PrismaAvailabilitySlot
> {
  toDomain(raw: PrismaAvailabilitySlot): AvailabilitySlot {
    const props: AvailabilitySlotProps = {
      mentorId: raw.mentorId,
      startTime: raw.startTime,
      endTime: raw.endTime,
      type: raw.type as AvailabilitySlotType,
      ruleId: raw.ruleId ?? null,
    };

    return AvailabilitySlot.create({
      ...props,
      id: new UniqueEntityID(raw.id),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
