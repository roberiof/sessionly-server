import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { type UserRepository } from 'src/domain/repositories';
import { USERS_REPOSITORY } from 'src/domain/repositories/tokens';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class UpdateUserPasswordMeUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const credentials = await this.userRepository.findCredentialsById(userId);

    if (!credentials) {
      throw new NotFoundException('User not found.');
    }

    const passwordMatches = await compare(
      currentPassword,
      credentials.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const passwordHash = await hash(newPassword, BCRYPT_SALT_ROUNDS);

    await this.userRepository.updatePasswordById(userId, passwordHash);
  }
}
