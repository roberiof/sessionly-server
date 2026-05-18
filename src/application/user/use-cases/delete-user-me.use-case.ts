import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { USERS_REPOSITORY } from 'src/domain/repositories/tokens';

@Injectable()
export class DeleteUserMeUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.deletedAt) {
      throw new BadRequestException('User already deleted.');
    }

    await this.userRepository.deleteById(id);
  }
}
