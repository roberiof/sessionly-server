import { Injectable } from '@nestjs/common';
import { AvailabilityRules } from 'src/domain/entities/availability-rules.entity';
import type {
  AvailabilityRulesRepository,
  CreateAvalabilityRulesInput,
  UpdateAvalabilityRulesInput,
} from 'src/domain/repositories/availability-rules.repository';
import { AvailabilityRulesMapper } from '../mappers/availability-rules.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaAvailabilityRulesRepository implements AvailabilityRulesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: AvailabilityRulesMapper,
  ) {}

  async findByMentorId(mentorId: string): Promise<AvailabilityRules | null> {
    const row = await this.prisma.availabilityRules.findUnique({
      where: { mentorId },
    });

    if (!row) return null;

    return this.mapper.toDomain(row);
  }

  async create(input: CreateAvalabilityRulesInput): Promise<AvailabilityRules> {
    const created = await this.prisma.availabilityRules.create({
      data: {
        mentorId: input.mentorId,
        days: input.days,
      },
    });

    return this.mapper.toDomain(created);
  }

  async updateByMentorId(
    mentorId: string,
    input: UpdateAvalabilityRulesInput,
  ): Promise<AvailabilityRules> {
    const updated = await this.prisma.availabilityRules.update({
      where: { mentorId },
      data: {
        days: input.days,
      },
    });

    return this.mapper.toDomain(updated);
  }

  async upsertByMentorId(
    input: CreateAvalabilityRulesInput,
  ): Promise<AvailabilityRules> {
    const row = await this.prisma.availabilityRules.upsert({
      where: { mentorId: input.mentorId },
      create: { mentorId: input.mentorId, days: input.days },
      update: { days: input.days },
    });

    return this.mapper.toDomain(row);
  }
}
