import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import type { PasswordResetTokenRepository } from 'src/domain/repositories/password-reset-token.repository';
import type { RefreshTokenRepository } from 'src/domain/repositories/refresh-token.repository';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { ResetPasswordUseCase } from '../reset-password.use-case';

const RAW_TOKEN = 'deadbeef'.repeat(8);

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function makeResetTokenRepo(
  record: { id: string; userId: string; expiresAt: Date } | null = null,
): jest.Mocked<
  Pick<PasswordResetTokenRepository, 'findByTokenHash' | 'deleteById'>
> {
  return {
    findByTokenHash: jest.fn().mockResolvedValue(record),
    deleteById: jest.fn().mockResolvedValue(undefined),
  };
}

function makeUserRepo(): jest.Mocked<
  Pick<UserRepository, 'updatePasswordById'>
> {
  return {
    updatePasswordById: jest.fn().mockResolvedValue(undefined),
  };
}

function makeRefreshTokenRepo(): jest.Mocked<
  Pick<RefreshTokenRepository, 'deleteAllByUserId'>
> {
  return {
    deleteAllByUserId: jest.fn().mockResolvedValue(undefined),
  };
}

describe('ResetPasswordUseCase', () => {
  it('throws UnauthorizedException when token not found', async () => {
    const useCase = new ResetPasswordUseCase(
      makeUserRepo() as unknown as UserRepository,
      makeResetTokenRepo(null) as unknown as PasswordResetTokenRepository,
      makeRefreshTokenRepo() as unknown as RefreshTokenRepository,
    );

    await expect(
      useCase.execute({ token: RAW_TOKEN, newPassword: 'newpass123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException and deletes token when expired', async () => {
    const record = {
      id: 'prt-1',
      userId: 'u-1',
      expiresAt: new Date(Date.now() - 1000),
    };
    const resetTokens = makeResetTokenRepo(record);
    const useCase = new ResetPasswordUseCase(
      makeUserRepo() as unknown as UserRepository,
      resetTokens as unknown as PasswordResetTokenRepository,
      makeRefreshTokenRepo() as unknown as RefreshTokenRepository,
    );

    await expect(
      useCase.execute({ token: RAW_TOKEN, newPassword: 'newpass123' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(resetTokens.deleteById).toHaveBeenCalledWith('prt-1');
  });

  it('updates password hash (not plaintext) on success', async () => {
    const record = {
      id: 'prt-1',
      userId: 'u-1',
      expiresAt: new Date(Date.now() + 60_000),
    };
    const users = makeUserRepo();
    const useCase = new ResetPasswordUseCase(
      users as unknown as UserRepository,
      makeResetTokenRepo(record) as unknown as PasswordResetTokenRepository,
      makeRefreshTokenRepo() as unknown as RefreshTokenRepository,
    );

    await useCase.execute({ token: RAW_TOKEN, newPassword: 'newpass123' });

    const [userId, passwordHash] = users.updatePasswordById.mock.calls[0];
    expect(userId).toBe('u-1');
    expect(passwordHash).not.toBe('newpass123');
    expect(passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('revokes all refresh tokens on success', async () => {
    const record = {
      id: 'prt-1',
      userId: 'u-1',
      expiresAt: new Date(Date.now() + 60_000),
    };
    const refreshTokens = makeRefreshTokenRepo();
    const useCase = new ResetPasswordUseCase(
      makeUserRepo() as unknown as UserRepository,
      makeResetTokenRepo(record) as unknown as PasswordResetTokenRepository,
      refreshTokens as unknown as RefreshTokenRepository,
    );

    await useCase.execute({ token: RAW_TOKEN, newPassword: 'newpass123' });

    expect(refreshTokens.deleteAllByUserId).toHaveBeenCalledWith('u-1');
  });

  it('deletes used reset token on success', async () => {
    const record = {
      id: 'prt-1',
      userId: 'u-1',
      expiresAt: new Date(Date.now() + 60_000),
    };
    const resetTokens = makeResetTokenRepo(record);
    const useCase = new ResetPasswordUseCase(
      makeUserRepo() as unknown as UserRepository,
      resetTokens as unknown as PasswordResetTokenRepository,
      makeRefreshTokenRepo() as unknown as RefreshTokenRepository,
    );

    await useCase.execute({ token: RAW_TOKEN, newPassword: 'newpass123' });

    expect(resetTokens.deleteById).toHaveBeenCalledWith('prt-1');
    expect(resetTokens.findByTokenHash).toHaveBeenCalledWith(
      hashToken(RAW_TOKEN),
    );
  });
});
