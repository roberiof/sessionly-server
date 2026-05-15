import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityStatus,
  User,
  UserProps,
  UserRole,
} from 'src/domain/entities/user.entity';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { DeleteUserUseCase } from '../delete-user.use-case';

function makeUser(overrides?: Partial<UserProps & { id: string }>): User {
  const { id, ...props } = overrides ?? {};
  return User.create({
    name: 'Test',
    email: 'test@example.com',
    role: UserRole.CLIENT,
    activityStatus: ActivityStatus.ACTIVE,
    links: [],
    deletedAt: null,
    ...props,
    ...(id ? { id: { toString: () => id } as any } : {}),
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

describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase;
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new DeleteUserUseCase(repo as unknown as UserRepository);
  });

  it('deletes own account without checking admin role', async () => {
    const user = makeUser({ deletedAt: null });
    repo.findById.mockResolvedValue(user);

    await useCase.execute(user.id.toString(), user.id.toString());

    expect(repo.deleteById).toHaveBeenCalledWith(user.id.toString());
  });

  it('allows ADMIN to delete another user', async () => {
    const admin = makeUser({ role: UserRole.ADMIN });
    const target = makeUser({ deletedAt: null });

    repo.findById.mockResolvedValueOnce(admin).mockResolvedValueOnce(target);

    await useCase.execute(target.id.toString(), admin.id.toString());

    expect(repo.deleteById).toHaveBeenCalledWith(target.id.toString());
  });

  it('throws ForbiddenException when non-admin tries to delete another user', async () => {
    const requester = makeUser({ role: UserRole.CLIENT });
    repo.findById.mockResolvedValue(requester);

    await expect(
      useCase.execute('other-id', requester.id.toString()),
    ).rejects.toThrow(ForbiddenException);
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when requester not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute('target-id', 'requester-id')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws NotFoundException when target user not found (admin path)', async () => {
    const admin = makeUser({ role: UserRole.ADMIN });

    repo.findById.mockResolvedValueOnce(admin).mockResolvedValueOnce(null);

    await expect(
      useCase.execute('target-id', admin.id.toString()),
    ).rejects.toThrow(NotFoundException);
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when user is already deleted', async () => {
    const deleted = makeUser({ deletedAt: new Date() });
    repo.findById.mockResolvedValue(deleted);

    await expect(
      useCase.execute(deleted.id.toString(), deleted.id.toString()),
    ).rejects.toThrow(BadRequestException);
    expect(repo.deleteById).not.toHaveBeenCalled();
  });
});
