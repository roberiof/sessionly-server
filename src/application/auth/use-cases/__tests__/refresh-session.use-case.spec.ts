import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import type { RefreshTokenRepository } from 'src/domain/repositories/refresh-token.repository';
import { RefreshSessionUseCase } from '../refresh-session.use-case';
import { SignTokensUseCase } from '../sign-tokens.use-case';

function makeRepo(
  record: { id: string; userId: string; expiresAt: Date } | null = null,
): jest.Mocked<Pick<RefreshTokenRepository, 'findByTokenHash' | 'deleteById'>> {
  return {
    findByTokenHash: jest.fn().mockResolvedValue(record),
    deleteById: jest.fn().mockResolvedValue(undefined),
  };
}

function makeSignTokens(
  result = { accessToken: 'access', refreshToken: 'refresh' },
) {
  return {
    execute: jest.fn().mockResolvedValue(result),
  } as unknown as SignTokensUseCase;
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

const RAW_TOKEN = 'raw-refresh-token';

describe('RefreshSessionUseCase', () => {
  it('throws UnauthorizedException when token hash not found', async () => {
    const repo = makeRepo(null);
    const useCase = new RefreshSessionUseCase(
      repo as unknown as RefreshTokenRepository,
      makeSignTokens(),
    );

    await expect(useCase.execute({ refreshToken: RAW_TOKEN })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(repo.findByTokenHash).toHaveBeenCalledWith(hashToken(RAW_TOKEN));
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException and deletes token when expired', async () => {
    const expiredRecord = {
      id: 'rt-1',
      userId: 'u1',
      expiresAt: new Date(Date.now() - 1000),
    };
    const repo = makeRepo(expiredRecord);
    const useCase = new RefreshSessionUseCase(
      repo as unknown as RefreshTokenRepository,
      makeSignTokens(),
    );

    await expect(useCase.execute({ refreshToken: RAW_TOKEN })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(repo.deleteById).toHaveBeenCalledWith('rt-1');
  });

  it('returns new token pair when token is valid', async () => {
    const validRecord = {
      id: 'rt-1',
      userId: 'u1',
      expiresAt: new Date(Date.now() + 60_000),
    };
    const repo = makeRepo(validRecord);
    const signTokens = makeSignTokens({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    const useCase = new RefreshSessionUseCase(
      repo as unknown as RefreshTokenRepository,
      signTokens,
    );

    const result = await useCase.execute({ refreshToken: RAW_TOKEN });

    expect(result).toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
  });

  it('deletes old token before issuing new pair (rotation)', async () => {
    const validRecord = {
      id: 'rt-1',
      userId: 'u1',
      expiresAt: new Date(Date.now() + 60_000),
    };
    const repo = makeRepo(validRecord);
    const executeMock = jest
      .fn()
      .mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
    const signTokens = { execute: executeMock } as unknown as SignTokensUseCase;
    const useCase = new RefreshSessionUseCase(
      repo as unknown as RefreshTokenRepository,
      signTokens,
    );

    await useCase.execute({ refreshToken: RAW_TOKEN });

    expect(repo.deleteById).toHaveBeenCalledWith('rt-1');
    expect(executeMock).toHaveBeenCalledWith({ userId: 'u1' });
  });
});
