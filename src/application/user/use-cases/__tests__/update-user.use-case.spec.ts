import { BadRequestException } from '@nestjs/common';
import {
  ActivityStatus,
  User,
  UserProps,
  UserRole,
} from 'src/domain/entities/user.entity';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { UpdateUserDto } from '../../dtos/update-user.dto';
import { UpdateUserMeUseCase } from '../update-user-me.use-case';

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

describe('UpdateUserMeUseCase', () => {
  let useCase: UpdateUserMeUseCase;
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new UpdateUserMeUseCase(repo as unknown as UserRepository);
  });

  describe('validation', () => {
    it('throws BadRequestException when all fields are undefined', async () => {
      const user = makeUser();

      await expect(
        useCase.execute(user.id.toString(), {} as UpdateUserDto),
      ).rejects.toThrow(BadRequestException);
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when name is empty string', async () => {
      const user = makeUser();

      await expect(
        useCase.execute(user.id.toString(), { name: '   ' }),
      ).rejects.toThrow(BadRequestException);
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when links is empty array', async () => {
      const user = makeUser();

      await expect(
        useCase.execute(user.id.toString(), { links: [] }),
      ).rejects.toThrow(BadRequestException);
      expect(repo.findById).not.toHaveBeenCalled();
    });
  });

  describe('update logic', () => {
    it('throws BadRequestException when user not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute('missing-id', { name: 'X' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('calls updateById with correct id and data, returns updated user', async () => {
      const user = makeUser();
      const updated = makeUser({ name: 'Updated' });

      repo.findById.mockResolvedValue(user);
      repo.updateById.mockResolvedValue(updated);

      const result = await useCase.execute(user.id.toString(), {
        name: 'Updated',
      });

      expect(repo.updateById).toHaveBeenCalledWith(user.id.toString(), {
        name: 'Updated',
      });
      expect(result).toBe(updated);
    });
  });
});
