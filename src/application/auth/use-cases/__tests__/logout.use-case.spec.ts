import { createHash } from 'crypto';
import type { RefreshTokenRepository } from 'src/domain/repositories/refresh-token.repository';
import { LogoutUseCase } from '../logout.use-case';

function makeRepo(
  record: { id: string; userId: string; expiresAt: Date } | null = null,
): jest.Mocked<Pick<RefreshTokenRepository, 'findByTokenHash' | 'deleteById'>> {
  return {
    findByTokenHash: jest.fn().mockResolvedValue(record),
    deleteById: jest.fn().mockResolvedValue(undefined),
  };
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

const RAW_TOKEN = 'raw-refresh-token';

describe('LogoutUseCase', () => {
  it('does nothing when token not found', async () => {
    const repo = makeRepo(null);
    const useCase = new LogoutUseCase(
      repo as unknown as RefreshTokenRepository,
    );

    await expect(
      useCase.execute({ refreshToken: RAW_TOKEN }),
    ).resolves.toBeUndefined();
    expect(repo.findByTokenHash).toHaveBeenCalledWith(hashToken(RAW_TOKEN));
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('deletes token record when found', async () => {
    const record = {
      id: 'rt-1',
      userId: 'u1',
      expiresAt: new Date(Date.now() + 60_000),
    };
    const repo = makeRepo(record);
    const useCase = new LogoutUseCase(
      repo as unknown as RefreshTokenRepository,
    );

    await useCase.execute({ refreshToken: RAW_TOKEN });

    expect(repo.deleteById).toHaveBeenCalledWith('rt-1');
  });

  it('resolves when deleteById fails (swallowed error)', async () => {
    const record = {
      id: 'rt-1',
      userId: 'u1',
      expiresAt: new Date(Date.now() + 60_000),
    };
    const repo = makeRepo(record);
    repo.deleteById.mockRejectedValue(new Error('DB error'));
    const useCase = new LogoutUseCase(
      repo as unknown as RefreshTokenRepository,
    );

    await expect(
      useCase.execute({ refreshToken: RAW_TOKEN }),
    ).resolves.toBeUndefined();
  });

  it('hashes raw token before querying repo', async () => {
    const repo = makeRepo(null);
    const useCase = new LogoutUseCase(
      repo as unknown as RefreshTokenRepository,
    );

    await useCase.execute({ refreshToken: RAW_TOKEN });

    expect(repo.findByTokenHash).toHaveBeenCalledWith(hashToken(RAW_TOKEN));
    expect(repo.findByTokenHash).not.toHaveBeenCalledWith(RAW_TOKEN);
  });
});
