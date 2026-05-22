import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import {
  AvailabilitySlotRepository,
  CreateAvalabilitySlotInput,
} from 'src/domain/repositories';
import { AvailabilitySlot } from 'src/domain/entities/availability-slot.entity';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilitySlotMapper } from '../mappers/availability-slot.mapper';

@Injectable()
export class PrismaAvailabilitySlotRepository implements AvailabilitySlotRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availabilitySlotMapper: AvailabilitySlotMapper,
  ) {}

  async findById(id: string): Promise<AvailabilitySlot | null> {
    const row = await this.prisma.availabilitySlot.findUnique({
      where: { id },
    });

    if (!row) {
      return null;
    }

    return this.availabilitySlotMapper.toDomain(row);
  }

  async findByMentorId(
    mentorId: string,
    options?: { from: Date; to: Date },
  ): Promise<AvailabilitySlot[]> {
    const where: Prisma.AvailabilitySlotWhereInput = { mentorId };

    if (options) {
      where.startTime = { lt: options.to };
      where.endTime = { gt: options.from };
    }

    const rows = await this.prisma.availabilitySlot.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });

    return rows.map((row) => this.availabilitySlotMapper.toDomain(row));
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.availabilitySlot.delete({
      where: { id },
    });
  }

  async create(input: CreateAvalabilitySlotInput): Promise<AvailabilitySlot> {
    const created = await this.prisma.availabilitySlot.create({
      data: {
        mentorId: input.mentorId,
        startTime: input.startTime,
        endTime: input.endTime,
        type: input.type,
        ruleId: input.ruleId,
      },
    });

    return this.availabilitySlotMapper.toDomain(created);
  }
}
