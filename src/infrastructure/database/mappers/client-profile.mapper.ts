import { Injectable } from '@nestjs/common';
import type {
  ClientProfile as PrismaClientProfile,
  Prisma,
} from 'generated/prisma/client';
import { UniqueEntityID } from 'src/core/entities/unique-entity-id';
import { Mapper } from 'src/core/mappers/mapper';
import { ClientProfile } from 'src/domain/entities/client-profile.entity';
import type { CreateClientProfilePersistenceInput } from 'src/domain/repositories/user.repository';

@Injectable()
export class ClientProfileMapper extends Mapper<
  ClientProfile,
  PrismaClientProfile
> {
  toDomain(raw: PrismaClientProfile): ClientProfile {
    return ClientProfile.create({
      id: new UniqueEntityID(raw.userId),
      interests: raw.interests,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  toPrismaUpdateInput(entity: ClientProfile): Prisma.ClientProfileUpdateInput {
    return {
      interests: entity.interests,
    };
  }

  toPrismaCreateInput(
    userId: string,
    input: CreateClientProfilePersistenceInput,
  ): Prisma.ClientProfileCreateInput {
    return {
      user: { connect: { id: userId } },
      interests: input.interests,
    };
  }
}
