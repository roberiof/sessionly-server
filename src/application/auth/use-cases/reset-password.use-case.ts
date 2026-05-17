import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { hash } from 'bcryptjs';
import {
  PASSWORD_RESET_TOKENS_REPOSITORY,
  REFRESH_TOKENS_REPOSITORY,
  USERS_REPOSITORY,
} from 'src/domain/repositories/tokens';
import type { PasswordResetTokenRepository } from 'src/domain/repositories/password-reset-token.repository';
import type { RefreshTokenRepository } from 'src/domain/repositories/refresh-token.repository';
import type { UserRepository } from 'src/domain/repositories/user.repository';

export type ResetPasswordInput = {
  token: string;
  newPassword: string;
};

const BCRYPT_ROUNDS = 10;

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly users: UserRepository,
    @Inject(PASSWORD_RESET_TOKENS_REPOSITORY)
    private readonly passwordResetTokens: PasswordResetTokenRepository,
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const tokenHash = createHash('sha256').update(input.token).digest('hex');
    const record = await this.passwordResetTokens.findByTokenHash(tokenHash);

    if (!record) {
      throw new UnauthorizedException('Invalid or expired reset token.');
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      await this.passwordResetTokens
        .deleteById(record.id)
        .catch(() => undefined);
      throw new UnauthorizedException('Invalid or expired reset token.');
    }

    const passwordHash = await hash(input.newPassword, BCRYPT_ROUNDS);

    await Promise.all([
      this.users.updatePasswordById(record.userId, passwordHash),
      this.passwordResetTokens.deleteById(record.id),
      this.refreshTokens.deleteAllByUserId(record.userId),
    ]);
  }
}
