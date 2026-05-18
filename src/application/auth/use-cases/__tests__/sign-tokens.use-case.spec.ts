import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import type { RefreshTokenRepository } from 'src/domain/repositories/refresh-token.repository';
import { SignTokensUseCase } from '../sign-tokens.use-case';

function makeRefreshTokenRepo(): jest.Mocked<
  Pick<RefreshTokenRepository, 'create'>
> {
  return { create: jest.fn().mockResolvedValue({ id: 'rt-1' }) };
}

function makeJwtService(
  accessToken = 'signed-access-token',
): jest.Mocked<Pick<JwtService, 'signAsync'>> {
  return { signAsync: jest.fn().mockResolvedValue(accessToken) };
}

function makeConfigService(
  values: Record<string, string> = {},
): jest.Mocked<Pick<ConfigService, 'get'>> {
  return {
    get: jest.fn().mockImplementation((key: string) => values[key]),
  };
}

describe('SignTokensUseCase', () => {
  const userId = 'user-123';

  it('returns access token from JwtService', async () => {
    const jwtService = makeJwtService('my-access-token');
    const useCase = new SignTokensUseCase(
      jwtService as unknown as JwtService,
      makeConfigService({ JWT_EXPIRES_IN: '15m' }) as unknown as ConfigService,
      makeRefreshTokenRepo() as unknown as RefreshTokenRepository,
    );

    const result = await useCase.execute({ userId });

    expect(result.accessToken).toBe('my-access-token');
  });

  it('signs access token with sub: userId and configured expiry', async () => {
    const jwtService = makeJwtService();
    const useCase = new SignTokensUseCase(
      jwtService as unknown as JwtService,
      makeConfigService({ JWT_EXPIRES_IN: '30m' }) as unknown as ConfigService,
      makeRefreshTokenRepo() as unknown as RefreshTokenRepository,
    );

    await useCase.execute({ userId });

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { sub: userId },
      { expiresIn: '30m' },
    );
  });

  it('returns a raw refresh token (non-empty string)', async () => {
    const useCase = new SignTokensUseCase(
      makeJwtService() as unknown as JwtService,
      makeConfigService({
        JWT_REFRESH_EXPIRES_DAYS: '7',
      }) as unknown as ConfigService,
      makeRefreshTokenRepo() as unknown as RefreshTokenRepository,
    );

    const result = await useCase.execute({ userId });

    expect(typeof result.refreshToken).toBe('string');
    expect(result.refreshToken.length).toBeGreaterThan(0);
  });

  it('stores SHA-256 hash of refresh token in repo, not the raw token', async () => {
    const repo = makeRefreshTokenRepo();
    const useCase = new SignTokensUseCase(
      makeJwtService() as unknown as JwtService,
      makeConfigService({
        JWT_REFRESH_EXPIRES_DAYS: '7',
      }) as unknown as ConfigService,
      repo as unknown as RefreshTokenRepository,
    );

    const result = await useCase.execute({ userId });

    const expectedHash = createHash('sha256')
      .update(result.refreshToken)
      .digest('hex');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ tokenHash: expectedHash, userId }),
    );
    expect(repo.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ tokenHash: result.refreshToken }),
    );
  });

  it('sets refresh token expiry based on JWT_REFRESH_EXPIRES_DAYS config', async () => {
    const repo = makeRefreshTokenRepo();
    const useCase = new SignTokensUseCase(
      makeJwtService() as unknown as JwtService,
      makeConfigService({
        JWT_REFRESH_EXPIRES_DAYS: '14',
      }) as unknown as ConfigService,
      repo as unknown as RefreshTokenRepository,
    );

    const before = new Date();
    await useCase.execute({ userId });
    const after = new Date();

    const { expiresAt } = repo.create.mock.calls[0][0] as { expiresAt: Date };
    const minExpected = new Date(before);
    minExpected.setUTCDate(minExpected.getUTCDate() + 14);
    const maxExpected = new Date(after);
    maxExpected.setUTCDate(maxExpected.getUTCDate() + 14);

    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(minExpected.getTime());
    expect(expiresAt.getTime()).toBeLessThanOrEqual(maxExpected.getTime());
  });

  it('defaults to 7 days expiry when JWT_REFRESH_EXPIRES_DAYS not set', async () => {
    const repo = makeRefreshTokenRepo();
    const useCase = new SignTokensUseCase(
      makeJwtService() as unknown as JwtService,
      makeConfigService({}) as unknown as ConfigService,
      repo as unknown as RefreshTokenRepository,
    );

    const before = new Date();
    await useCase.execute({ userId });
    const after = new Date();

    const { expiresAt } = repo.create.mock.calls[0][0] as { expiresAt: Date };
    const minExpected = new Date(before);
    minExpected.setUTCDate(minExpected.getUTCDate() + 7);
    const maxExpected = new Date(after);
    maxExpected.setUTCDate(maxExpected.getUTCDate() + 7);

    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(minExpected.getTime());
    expect(expiresAt.getTime()).toBeLessThanOrEqual(maxExpected.getTime());
  });
});
