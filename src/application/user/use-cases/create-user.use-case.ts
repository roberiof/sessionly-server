import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { UserRole } from 'src/domain/entities/user.entity';
import { USERS_REPOSITORY } from 'src/domain/repositories/tokens';
import type {
  CreateProfilePersistenceInput,
  UserRepository,
} from 'src/domain/repositories/user.repository';
import type { CreateUserDto } from '../dtos/create-user.dto';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UserRepository,
  ) {}

  async execute(input: CreateUserDto) {
    const existing = await this.usersRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await hash(input.password, BCRYPT_SALT_ROUNDS);
    const links = input.links ?? [];

    let profileInput: CreateProfilePersistenceInput = null;
    if (input.role === UserRole.MENTOR && input.mentorProfile) {
      profileInput = { type: 'MENTOR', data: input.mentorProfile };
    } else if (input.role === UserRole.CLIENT && input.clientProfile) {
      profileInput = { type: 'CLIENT', data: input.clientProfile };
    }

    return this.usersRepository.createWithProfile(
      {
        name: input.name,
        email: input.email,
        bio: input.bio,
        avatarUrl: input.avatarUrl,
        role: input.role,
        links,
        passwordHash,
      },
      profileInput,
    );
  }
}
