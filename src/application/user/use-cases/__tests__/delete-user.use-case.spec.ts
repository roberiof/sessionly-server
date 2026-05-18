import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  ActivityStatus,
  User,
  UserProps,
  UserRole,
} from 'src/domain/entities/user.entity';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { DeleteUserMeUseCase } from '../delete-user-me.use-case';

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
  Pick<UserRepository, 'findById' | 'deleteById'>
> {
  return {
    findById: jest.fn(),
    deleteById: jest.fn().mockResolvedValue(undefined),
  };
}

describe('DeleteUserMeUseCase', () => {
  let useCase: DeleteUserMeUseCase;
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new DeleteUserMeUseCase(repo as unknown as UserRepository);
  });

  it('deletes own account successfully', async () => {
    const user = makeUser({ deletedAt: null });
    repo.findById.mockResolvedValue(user);

    await useCase.execute(user.id.toString());

    expect(repo.deleteById).toHaveBeenCalledWith(user.id.toString());
  });

  it('throws NotFoundException when user not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing-id')).rejects.toThrow(
      NotFoundException,
    );
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when user is already deleted', async () => {
    const deleted = makeUser({ deletedAt: new Date() });
    repo.findById.mockResolvedValue(deleted);

    await expect(useCase.execute(deleted.id.toString())).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.deleteById).not.toHaveBeenCalled();
  });
});
