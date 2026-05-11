import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { REFRESH_TOKENS_REPOSITORY } from 'src/domain/repositories/tokens';
import type { RefreshTokenRepository } from 'src/domain/repositories/refresh-token.repository';
import { generateRefreshToken, hashRefreshToken } from '../utils/refresh-token';

export type SignTokensInput = {
  userId: string;
};

export type SignTokensResult = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class SignTokensUseCase {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async execute(input: SignTokensInput): Promise<SignTokensResult> {
    const accessExpiresIn = (this.configService.get<string>('JWT_EXPIRES_IN') ??
      '15m') as JwtSignOptions['expiresIn'];

    const accessToken = await this.jwtService.signAsync(
      { sub: input.userId },
      { expiresIn: accessExpiresIn },
    );

    const refreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);

    const refreshDaysRaw = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_DAYS',
    );
    const refreshDays = Number(refreshDaysRaw ?? 7);
    const expiresAt = new Date();
    expiresAt.setUTCDate(expiresAt.getUTCDate() + refreshDays);

    await this.refreshTokens.create({
      userId: input.userId,
      tokenHash,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }
}
