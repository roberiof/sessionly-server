import { Injectable } from '@nestjs/common';
import type { AvailabilityRules as PrismaAvailabilityRules } from 'generated/prisma/client';
import { UniqueEntityID } from 'src/core/entities/unique-entity-id';
import { Mapper } from 'src/core/mappers/mapper';
import {
  AvailabilityRules,
  AvailabilityRulesProps,
} from 'src/domain/entities/availability-rules.entity';

@Injectable()
export class AvailabilityRulesMapper extends Mapper<
  AvailabilityRules,
  PrismaAvailabilityRules
> {
  toDomain(raw: PrismaAvailabilityRules): AvailabilityRules {
    return AvailabilityRules.create({
      mentorId: raw.mentorId,
      days: raw.days as unknown as AvailabilityRulesProps['days'],
      id: new UniqueEntityID(raw.id),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
