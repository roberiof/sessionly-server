import { Injectable } from '@nestjs/common';
import type {
  MentorProfile as PrismaMentorProfile,
  Prisma,
} from 'generated/prisma/client';
import { UniqueEntityID } from 'src/core/entities/unique-entity-id';
import { Mapper } from 'src/core/mappers/mapper';
import { MentorProfile } from 'src/domain/entities/mentor-profile.entity';
import type { CreateMentorProfilePersistenceInput } from 'src/domain/repositories/user.repository';

@Injectable()
export class MentorProfileMapper extends Mapper<
  MentorProfile,
  PrismaMentorProfile
> {
  toDomain(raw: PrismaMentorProfile): MentorProfile {
    return MentorProfile.create({
      id: new UniqueEntityID(raw.userId),
      niche: raw.niche,
      specialties: raw.specialties,
      chatPrice: raw.chatPrice ?? null,
      hourPrice: raw.hourPrice ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  toPrismaUpdateInput(entity: MentorProfile): Prisma.MentorProfileUpdateInput {
    return {
      niche: entity.niche,
      specialties: entity.specialties,
      chatPrice: entity.chatPrice,
      hourPrice: entity.hourPrice,
    };
  }

  toPrismaCreateInput(
    userId: string,
    input: CreateMentorProfilePersistenceInput,
  ): Prisma.MentorProfileCreateInput {
    return {
      user: { connect: { id: userId } },
      niche: input.niche,
      specialties: input.specialties,
      chatPrice: undefined,
      hourPrice: undefined,
    };
  }
}
