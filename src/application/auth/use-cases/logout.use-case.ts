import { Inject, Injectable } from '@nestjs/common';
import { REFRESH_TOKENS_REPOSITORY } from 'src/domain/repositories/tokens';
import type { RefreshTokenRepository } from 'src/domain/repositories/refresh-token.repository';
import { hashRefreshToken } from '../utils/refresh-token';

type LogoutInput = {
  refreshToken: string;
};

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    const tokenHash = hashRefreshToken(input.refreshToken);
    const record = await this.refreshTokens.findByTokenHash(tokenHash);

    if (!record) {
      return;
    }

    await this.refreshTokens.deleteById(record.id).catch(() => undefined);
  }
}
