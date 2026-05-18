import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { User } from 'src/domain/entities/user.entity';
import type {
  CreateProfilePersistenceInput,
  CreateUserPersistenceInput,
  UpdateUserPersistenceInput,
  UserProfile,
  UserRepository,
  UserWithProfile,
} from 'src/domain/repositories/user.repository';
import { ClientProfileMapper } from '../mappers/client-profile.mapper';
import { MentorProfileMapper } from '../mappers/mentor-profile.mapper';
import { PrismaRepositoryBase } from '../prisma/prisma-repository.base';
import { PrismaService } from '../prisma/prisma.service';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class PrismaUserRepository
  extends PrismaRepositoryBase
  implements UserRepository
{
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly userMapper: UserMapper,
    private readonly mentorProfileMapper: MentorProfileMapper,
    private readonly clientProfileMapper: ClientProfileMapper,
  ) {
    super(configService);
  }

  private toProfile(raw: {
    mentorProfile: Parameters<MentorProfileMapper['toDomain']>[0] | null;
    clientProfile: Parameters<ClientProfileMapper['toDomain']>[0] | null;
  }): UserProfile {
    if (raw.mentorProfile) {
      return this.mentorProfileMapper.toDomain(raw.mentorProfile);
    }
    if (raw.clientProfile) {
      return this.clientProfileMapper.toDomain(raw.clientProfile);
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.prisma.user.findUnique({ where: { id } });

    if (!result) return null;

    return this.userMapper.toDomain(result);
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!row) return null;

    return this.userMapper.toDomain(row);
  }

  async findCredentialsByEmail(email: string) {
    const row = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true, passwordHash: true },
    });

    if (!row) return null;

    return { id: row.id, passwordHash: row.passwordHash };
  }

  async findCredentialsById(id: string) {
    const row = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, passwordHash: true },
    });

    if (!row) return null;

    return { id: row.id, passwordHash: row.passwordHash };
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateById(
    id: string,
    data: UpdateUserPersistenceInput,
  ): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: this.userMapper.toPrismaUpdateInput(data),
    });

    return this.userMapper.toDomain(updated);
  }

  async createWithProfile(
    userInput: CreateUserPersistenceInput,
    profileInput: CreateProfilePersistenceInput,
  ): Promise<UserWithProfile> {
    return this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: this.userMapper.toPrismaCreateInput(userInput),
      });

      let profile: UserProfile = null;

      if (profileInput?.type === 'MENTOR') {
        const raw = await tx.mentorProfile.create({
          data: this.mentorProfileMapper.toPrismaCreateInput(
            createdUser.id,
            profileInput.data,
          ),
        });
        profile = this.mentorProfileMapper.toDomain(raw);
      } else if (profileInput?.type === 'CLIENT') {
        const raw = await tx.clientProfile.create({
          data: this.clientProfileMapper.toPrismaCreateInput(
            createdUser.id,
            profileInput.data,
          ),
        });
        profile = this.clientProfileMapper.toDomain(raw);
      }

      return { user: this.userMapper.toDomain(createdUser), profile };
    });
  }

  async findByIdWithProfile(id: string): Promise<UserWithProfile | null> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      include: { mentorProfile: true, clientProfile: true },
    });

    if (!row) return null;

    return {
      user: this.userMapper.toDomain(row),
      profile: this.toProfile(row),
    };
  }

  async updatePasswordById(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async restoreUserById(id: string): Promise<UserWithProfile> {
    const row = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
      include: { mentorProfile: true, clientProfile: true },
    });

    return {
      user: this.userMapper.toDomain(row),
      profile: this.toProfile(row),
    };
  }
}
