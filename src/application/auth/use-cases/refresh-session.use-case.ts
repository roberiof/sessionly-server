import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { REFRESH_TOKENS_REPOSITORY } from 'src/domain/repositories/tokens';
import type { RefreshTokenRepository } from 'src/domain/repositories/refresh-token.repository';
import { hashRefreshToken } from '../utils/refresh-token';
import { SignTokensUseCase } from './sign-tokens.use-case';

type RefreshSessionInput = {
  refreshToken: string;
};

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly signTokensUseCase: SignTokensUseCase,
  ) {}

  async execute(input: RefreshSessionInput) {
    const tokenHash = hashRefreshToken(input.refreshToken);
    const record = await this.refreshTokens.findByTokenHash(tokenHash);

    if (!record) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      await this.refreshTokens.deleteById(record.id).catch(() => undefined);
      throw new UnauthorizedException('Refresh token expired.');
    }

    await this.refreshTokens.deleteById(record.id);

    return this.signTokensUseCase.execute({ userId: record.userId });
  }
}
