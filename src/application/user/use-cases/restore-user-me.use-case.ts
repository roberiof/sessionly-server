import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { USERS_REPOSITORY } from 'src/domain/repositories/tokens';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { differenceInDays } from 'date-fns';

@Injectable()
export class RestoreUserMeUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UserRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.deletedAt) {
      throw new BadRequestException('User is not deleted.');
    }

    if (differenceInDays(new Date(), user.deletedAt) > 7) {
      throw new BadRequestException(
        'Not possible to restore the user anymore. Contact suport',
      );
    }

    await this.usersRepository.restoreUserById(userId);
  }
}
