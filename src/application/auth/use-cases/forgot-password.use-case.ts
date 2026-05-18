import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { EmailService } from 'src/infrastructure/email/email.service';
import {
  PASSWORD_RESET_TOKENS_REPOSITORY,
  USERS_REPOSITORY,
} from 'src/domain/repositories/tokens';
import type { PasswordResetTokenRepository } from 'src/domain/repositories/password-reset-token.repository';
import type { UserRepository } from 'src/domain/repositories/user.repository';

type ForgotPasswordInput = {
  email: string;
};

const RESET_TOKEN_EXPIRY_MINUTES = 30;

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly users: UserRepository,
    @Inject(PASSWORD_RESET_TOKENS_REPOSITORY)
    private readonly passwordResetTokens: PasswordResetTokenRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(input: ForgotPasswordInput): Promise<void> {
    const user = await this.users.findByEmail(input.email);

    if (!user) {
      return;
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + RESET_TOKEN_EXPIRY_MINUTES);

    await this.passwordResetTokens.deleteAllByUserId(user.id);
    await this.passwordResetTokens.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await this.emailService.sendPasswordResetEmail({
      to: user.email,
      resetToken: rawToken,
    });
  }
}
