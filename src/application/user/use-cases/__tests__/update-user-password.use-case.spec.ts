import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { UpdateUserPasswordMeUseCase } from '../update-user-password-me.use-case';

function makeRepo(): jest.Mocked<
  Pick<UserRepository, 'findCredentialsById' | 'updatePasswordById'>
> {
  return {
    findCredentialsById: jest.fn(),
    updatePasswordById: jest.fn().mockResolvedValue(undefined),
  };
}

describe('UpdateUserPasswordMeUseCase', () => {
  let useCase: UpdateUserPasswordMeUseCase;
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new UpdateUserPasswordMeUseCase(
      repo as unknown as UserRepository,
    );
  });

  it('throws NotFoundException when user not found', async () => {
    repo.findCredentialsById.mockResolvedValue(null);

    await expect(
      useCase.execute('missing-id', 'current', 'newpass123'),
    ).rejects.toThrow(NotFoundException);
    expect(repo.updatePasswordById).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when current password is wrong', async () => {
    const passwordHash = await hash('correct-password', 12);
    repo.findCredentialsById.mockResolvedValue({
      id: 'user-id',
      passwordHash,
    });

    await expect(
      useCase.execute('user-id', 'wrong-password', 'newpass123'),
    ).rejects.toThrow(UnauthorizedException);
    expect(repo.updatePasswordById).not.toHaveBeenCalled();
  });

  it('updates password when current password is correct', async () => {
    const passwordHash = await hash('correct-password', 12);
    repo.findCredentialsById.mockResolvedValue({
      id: 'user-id',
      passwordHash,
    });

    await useCase.execute('user-id', 'correct-password', 'newpass123');

    expect(repo.updatePasswordById).toHaveBeenCalledWith(
      'user-id',
      expect.any(String),
    );
    const [, savedHash] = repo.updatePasswordById.mock.calls[0];
    expect(savedHash).not.toBe('newpass123');
    expect(savedHash).toMatch(/^\$2[ab]\$/);
  });
});
