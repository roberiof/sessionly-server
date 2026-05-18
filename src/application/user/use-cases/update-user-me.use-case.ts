import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { hasAtLeastOneMeaningfulField } from 'src/core/validation/at-least-one-meaningful-field';
import { User } from 'src/domain/entities/user.entity';
import { USERS_REPOSITORY } from 'src/domain/repositories';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { UpdateUserDto } from '../dtos/update-user.dto';

const UPDATE_USER_PATCH_KEYS: (keyof UpdateUserDto)[] = [
  'name',
  'bio',
  'avatarUrl',
  'links',
];

@Injectable()
export class UpdateUserMeUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string, data: UpdateUserDto): Promise<User> {
    if (!hasAtLeastOneMeaningfulField(data, UPDATE_USER_PATCH_KEYS)) {
      throw new BadRequestException(
        'At least one of: name, bio, avatarUrl, or links must be provided with a non-empty value.',
      );
    }

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    return this.userRepository.updateById(id, data);
  }
}
