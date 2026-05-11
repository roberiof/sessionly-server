import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from 'src/domain/entities/user.entity';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { USERS_REPOSITORY } from 'src/domain/repositories/tokens';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string, requesterId: string): Promise<void> {
    if (requesterId !== id) {
      const requester = await this.userRepository.findById(requesterId);
      if (!requester || requester.role !== UserRole.ADMIN) {
        throw new ForbiddenException('You can only delete your own account.');
      }
    }

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
