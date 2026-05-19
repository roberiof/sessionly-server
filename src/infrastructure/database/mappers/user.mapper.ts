import { Injectable } from '@nestjs/common';
import type { Prisma, User as PrismaUser } from 'generated/prisma/client';
import { Mapper } from 'src/core/mappers/mapper';
import { UniqueEntityID } from 'src/core/entities/unique-entity-id';
import {
  ActivityStatus,
  User,
  UserRole,
  type UserProps,
} from 'src/domain/entities/user.entity';
import type {
  CreateUserPersistenceInput,
  UpdateUserPersistenceInput,
} from 'src/domain/repositories/user.repository';

@Injectable()
export class UserMapper extends Mapper<User, PrismaUser> {
  toDomain(raw: PrismaUser): User {
    const props: UserProps = {
      name: raw.name,
      bio: raw.bio,
      email: raw.email,
      avatarUrl: raw.avatarUrl,
      role: raw.role as UserRole,
      activityStatus: raw.activityStatus as ActivityStatus,
      links: raw.links,
      deletedAt: raw.deletedAt,
    };

    return User.create({
      ...props,
      id: new UniqueEntityID(raw.id),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  toPrismaCreateInput(
    input: CreateUserPersistenceInput,
  ): Prisma.UserCreateInput {
    return {
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      avatarUrl: input.avatarUrl ?? null,
      bio: input.bio ?? null,
      role: input.role,
      activityStatus: input.activityStatus,
      links: input.links,
      deletedAt: null,
    };
  }

  toPrismaUpdateInput(
    data: UpdateUserPersistenceInput,
  ): Prisma.UserUpdateInput {
    return {
      name: data.name,
      bio: data.bio ?? null,
      avatarUrl: data.avatarUrl ?? null,
      links: data.links,
    };
  }
}
