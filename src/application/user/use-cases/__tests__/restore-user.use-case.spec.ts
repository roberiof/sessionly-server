import { BadRequestException, NotFoundException } from '@nestjs/common';
import { subDays } from 'date-fns';
import {
  ActivityStatus,
  User,
  UserProps,
  UserRole,
} from 'src/domain/entities/user.entity';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { RestoreUserMeUseCase } from '../restore-user-me.use-case';

function makeUser(overrides?: Partial<UserProps>): User {
  return User.create({
    name: 'Test',
    email: 'test@example.com',
    role: UserRole.CLIENT,
    activityStatus: ActivityStatus.ACTIVE,
    links: [],
    deletedAt: null,
    ...overrides,
  });
}

function makeRepo(): jest.Mocked<
  Pick<UserRepository, 'findById' | 'restoreUserById'>
> {
  return {
    findById: jest.fn(),
    restoreUserById: jest.fn().mockResolvedValue(undefined),
  };
}

describe('RestoreUserMeUseCase', () => {
  let useCase: RestoreUserMeUseCase;
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new RestoreUserMeUseCase(repo as unknown as UserRepository);
  });

  it('throws NotFoundException when user not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing-id')).rejects.toThrow(
      NotFoundException,
    );
    expect(repo.restoreUserById).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when user is not deleted', async () => {
    const user = makeUser({ deletedAt: null });
    repo.findById.mockResolvedValue(user);

    await expect(useCase.execute(user.id.toString())).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.restoreUserById).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when deletion window has expired (> 7 days)', async () => {
    const user = makeUser({ deletedAt: subDays(new Date(), 8) });
    repo.findById.mockResolvedValue(user);

    await expect(useCase.execute(user.id.toString())).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.restoreUserById).not.toHaveBeenCalled();
  });

  it('restores user deleted within the 7-day window', async () => {
    const user = makeUser({ deletedAt: subDays(new Date(), 3) });
    repo.findById.mockResolvedValue(user);

    await useCase.execute(user.id.toString());

    expect(repo.restoreUserById).toHaveBeenCalledWith(user.id.toString());
  });

  it('restores user deleted exactly on the boundary (7 days)', async () => {
    const user = makeUser({ deletedAt: subDays(new Date(), 7) });
    repo.findById.mockResolvedValue(user);

    await useCase.execute(user.id.toString());

    expect(repo.restoreUserById).toHaveBeenCalledWith(user.id.toString());
  });
});
