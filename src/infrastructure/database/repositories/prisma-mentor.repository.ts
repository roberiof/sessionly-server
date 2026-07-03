import { Injectable } from '@nestjs/common';
import type { Prisma } from 'generated/prisma/client';
import { ActivityStatus, UserRole } from 'src/domain/entities/user.entity';
import type {
  MentorFilters,
  MentorListItem,
  MentorListResult,
  MentorRepository,
} from 'src/domain/repositories/mentor.repository';
import { MentorProfileMapper } from '../mappers/mentor-profile.mapper';
import { UserMapper } from '../mappers/user.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaMentorRepository implements MentorRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userMapper: UserMapper,
    private readonly mentorProfileMapper: MentorProfileMapper,
  ) {}

  private buildWhere(filters: MentorFilters): Prisma.UserWhereInput {
    const mentorProfileFilter: Prisma.MentorProfileWhereInput = {
      specialties: { isEmpty: false },
      AND: [
        { hourPrice: { not: null } },
        ...(filters.minPrice !== undefined
          ? [{ hourPrice: { gte: filters.minPrice } }]
          : []),
        ...(filters.maxPrice !== undefined
          ? [{ hourPrice: { lte: filters.maxPrice } }]
          : []),
      ],
    };

    if (filters.niche) {
      mentorProfileFilter.niche = {
        contains: filters.niche,
        mode: 'insensitive',
      };
    }

    if (filters.specialties?.length) {
      mentorProfileFilter.AND = [
        ...(mentorProfileFilter.AND as Prisma.MentorProfileWhereInput[]),
        { specialties: { hasSome: filters.specialties } },
      ];
    }

    if (filters.availableFrom && filters.availableTo) {
      mentorProfileFilter.availabilitySlots = {
        some: {
          type: 'ADD',
          startTime: { lt: filters.availableTo },
          endTime: { gt: filters.availableFrom },
        },
      };
    }

    const where: Prisma.UserWhereInput = {
      role: UserRole.MENTOR,
      deletedAt: null,
      activityStatus: { not: ActivityStatus.INACTIVE },
      mentorProfile: mentorProfileFilter,
    };

    if (filters.search) {
      where.AND = [
        {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { bio: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    return where;
  }

  async findMany(filters: MentorFilters): Promise<MentorListResult> {
    const where = this.buildWhere(filters);

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { mentorProfile: true },
        skip: filters.skip,
        take: filters.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const items: MentorListItem[] = rows
      .filter((row) => row.mentorProfile !== null)
      .map((row) => ({
        user: this.userMapper.toDomain(row),
        mentorProfile: this.mentorProfileMapper.toDomain(row.mentorProfile!),
      }));

    return { items, total };
  }

  async findByIdWithProfile(id: string): Promise<MentorListItem | null> {
    const row = await this.prisma.user.findUnique({
      where: {
        id,
        role: UserRole.MENTOR,
        deletedAt: null,
        activityStatus: { not: ActivityStatus.INACTIVE },
      },
      include: { mentorProfile: true },
    });

    if (!row || !row.mentorProfile) return null;

    return {
      user: this.userMapper.toDomain(row),
      mentorProfile: this.mentorProfileMapper.toDomain(row.mentorProfile),
    };
  }
}
