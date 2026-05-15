import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  ActivityStatus,
  User,
  UserProps,
  UserRole,
} from 'src/domain/entities/user.entity';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { UpdateUserDto } from '../../dtos/update-user.dto';
import { UpdateUserUseCase } from '../update-user.use-case';

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
  Pick<UserRepository, 'findById' | 'updateById'>
> {
  return {
    findById: jest.fn(),
    updateById: jest.fn(),
  };
}

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new UpdateUserUseCase(repo as unknown as UserRepository);
  });

  describe('authorization', () => {
    it('allows user to update own account without admin check', async () => {
      const user = makeUser();
      repo.findById.mockResolvedValue(user);
      repo.updateById.mockResolvedValue(user);

      await useCase.execute(
        user.id.toString(),
        { name: 'New Name' },
        user.id.toString(),
      );

      expect(repo.updateById).toHaveBeenCalledWith(user.id.toString(), {
        name: 'New Name',
      });
    });

    it('allows ADMIN to update another user', async () => {
      const admin = makeUser({ role: UserRole.ADMIN });
      const target = makeUser();

      repo.findById.mockResolvedValueOnce(admin).mockResolvedValueOnce(target);
      repo.updateById.mockResolvedValue(target);

      await useCase.execute(
        target.id.toString(),
        { name: 'Updated' },
        admin.id.toString(),
      );

      expect(repo.updateById).toHaveBeenCalledWith(target.id.toString(), {
        name: 'Updated',
      });
    });

    it('throws ForbiddenException when non-admin updates another user', async () => {
      const requester = makeUser({ role: UserRole.CLIENT });
      repo.findById.mockResolvedValue(requester);

      await expect(
        useCase.execute('other-id', { name: 'X' }, requester.id.toString()),
      ).rejects.toThrow(ForbiddenException);
      expect(repo.updateById).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when requester not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute('target-id', { name: 'X' }, 'requester-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('validation', () => {
    it('throws BadRequestException when all fields are undefined', async () => {
      const user = makeUser();

      await expect(
        useCase.execute(
          user.id.toString(),
          {} as UpdateUserDto,
          user.id.toString(),
        ),
      ).rejects.toThrow(BadRequestException);
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when name is empty string', async () => {
      const user = makeUser();

      await expect(
        useCase.execute(
          user.id.toString(),
          { name: '   ' },
          user.id.toString(),
        ),
      ).rejects.toThrow(BadRequestException);
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when links is empty array', async () => {
      const user = makeUser();

      await expect(
        useCase.execute(user.id.toString(), { links: [] }, user.id.toString()),
      ).rejects.toThrow(BadRequestException);
      expect(repo.findById).not.toHaveBeenCalled();
    });
  });

  describe('update logic', () => {
    it('throws BadRequestException when target user not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute('missing-id', { name: 'X' }, 'missing-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('calls updateById with correct id and data, returns updated user', async () => {
      const user = makeUser();
      const updated = makeUser({ name: 'Updated' });

      repo.findById.mockResolvedValue(user);
      repo.updateById.mockResolvedValue(updated);

      const result = await useCase.execute(
        user.id.toString(),
        { name: 'Updated' },
        user.id.toString(),
      );

      expect(repo.updateById).toHaveBeenCalledWith(user.id.toString(), {
        name: 'Updated',
      });
      expect(result).toBe(updated);
    });
  });
});
