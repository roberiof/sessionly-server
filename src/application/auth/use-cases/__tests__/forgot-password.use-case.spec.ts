import type { PasswordResetTokenRepository } from 'src/domain/repositories/password-reset-token.repository';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import type { EmailService } from 'src/infrastructure/email/email.service';
import { ForgotPasswordUseCase } from '../forgot-password.use-case';

function makeUserRepo(
  user: { id: string; email: string } | null = null,
): jest.Mocked<Pick<UserRepository, 'findByEmail'>> {
  return {
    findByEmail: jest.fn().mockResolvedValue(user),
  };
}

function makeResetTokenRepo(): jest.Mocked<
  Pick<PasswordResetTokenRepository, 'create' | 'deleteAllByUserId'>
> {
  return {
    create: jest.fn().mockResolvedValue({ id: 'prt-1' }),
    deleteAllByUserId: jest.fn().mockResolvedValue(undefined),
  };
}

function makeEmailService(): jest.Mocked<
  Pick<EmailService, 'sendPasswordResetEmail'>
> {
  return {
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };
}

describe('ForgotPasswordUseCase', () => {
  it('does nothing when email not found', async () => {
    const users = makeUserRepo(null);
    const resetTokens = makeResetTokenRepo();
    const emailService = makeEmailService();
    const useCase = new ForgotPasswordUseCase(
      users as unknown as UserRepository,
      resetTokens as unknown as PasswordResetTokenRepository,
      emailService as unknown as EmailService,
    );

    await expect(
      useCase.execute({ email: 'unknown@example.com' }),
    ).resolves.toBeUndefined();
    expect(resetTokens.create).not.toHaveBeenCalled();
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('invalidates existing tokens before creating new one', async () => {
    const user = { id: 'u-1', email: 'user@example.com' };
    const users = makeUserRepo(user);
    const resetTokens = makeResetTokenRepo();
    const emailService = makeEmailService();
    const useCase = new ForgotPasswordUseCase(
      users as unknown as UserRepository,
      resetTokens as unknown as PasswordResetTokenRepository,
      emailService as unknown as EmailService,
    );

    await useCase.execute({ email: user.email });

    expect(resetTokens.deleteAllByUserId).toHaveBeenCalledWith('u-1');
    expect(resetTokens.create).toHaveBeenCalled();
  });

  it('creates token with 30-min expiry and sends email', async () => {
    const user = { id: 'u-1', email: 'user@example.com' };
    const users = makeUserRepo(user);
    const resetTokens = makeResetTokenRepo();
    const emailService = makeEmailService();
    const before = Date.now();
    const useCase = new ForgotPasswordUseCase(
      users as unknown as UserRepository,
      resetTokens as unknown as PasswordResetTokenRepository,
      emailService as unknown as EmailService,
    );

    await useCase.execute({ email: user.email });

    const createCall = resetTokens.create.mock.calls[0][0];
    expect(createCall.userId).toBe('u-1');
    expect(createCall.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(createCall.expiresAt.getTime()).toBeGreaterThan(
      before + 29 * 60 * 1000,
    );
    expect(createCall.expiresAt.getTime()).toBeLessThan(
      before + 31 * 60 * 1000,
    );

    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: user.email }),
    );
  });

  it('sends raw token (not hash) in email', async () => {
    const user = { id: 'u-1', email: 'user@example.com' };
    const users = makeUserRepo(user);
    const resetTokens = makeResetTokenRepo();
    const emailService = makeEmailService();
    const useCase = new ForgotPasswordUseCase(
      users as unknown as UserRepository,
      resetTokens as unknown as PasswordResetTokenRepository,
      emailService as unknown as EmailService,
    );

    await useCase.execute({ email: user.email });

    const storedHash = resetTokens.create.mock.calls[0][0].tokenHash;
    const emailedToken =
      emailService.sendPasswordResetEmail.mock.calls[0][0].resetToken;

    expect(emailedToken).not.toBe(storedHash);
  });
});
