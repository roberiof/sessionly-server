import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USERS_REPOSITORY } from 'src/domain/repositories/tokens';
import type { UserRepository } from 'src/domain/repositories/user.repository';

@Injectable()
export class FetchUserMeUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.userRepository.findByIdWithProfile(userId);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }
}
