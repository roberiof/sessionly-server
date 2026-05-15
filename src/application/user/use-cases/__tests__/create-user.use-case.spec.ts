import { ConflictException } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { ActivityStatus, UserRole } from 'src/domain/entities/user.entity';
import type { User } from 'src/domain/entities/user.entity';
import type {
  UserRepository,
  UserWithProfile,
} from 'src/domain/repositories/user.repository';
import { CreateUserDto } from '../../dtos/create-user.dto';
import { CreateUserUseCase } from '../create-user.use-case';

function makeUser(role = UserRole.CLIENT) {
  return {
    user: {
      id: { toString: () => 'u1' },
      name: 'Test',
      email: 'test@example.com',
      role,
      activityStatus: ActivityStatus.ACTIVE,
      links: [],
      deletedAt: null,
    },
    profile: null,
  } as unknown as UserWithProfile;
}

function makeRepo(): jest.Mocked<
  Pick<UserRepository, 'findByEmail' | 'createWithProfile'>
> {
  return {
    findByEmail: jest.fn().mockResolvedValue(null),
    createWithProfile: jest.fn().mockResolvedValue(makeUser()),
  };
}

const baseDto: CreateUserDto = {
  name: 'Ada',
  bio: 'Developer',
  email: 'ada@example.com',
  password: 'secret123',
  role: UserRole.CLIENT,
};

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new CreateUserUseCase(repo as unknown as UserRepository);
  });

  it('throws ConflictException when email already exists', async () => {
    repo.findByEmail.mockResolvedValue({} as unknown as User);

    await expect(useCase.execute(baseDto)).rejects.toThrow(ConflictException);
    expect(repo.createWithProfile).not.toHaveBeenCalled();
  });

  it('hashes password before storing', async () => {
    await useCase.execute(baseDto);

    const [userInput] = repo.createWithProfile.mock.calls[0];
    expect(userInput.passwordHash).not.toBe(baseDto.password);
    expect(await compare(baseDto.password, userInput.passwordHash)).toBe(true);
  });

  it('defaults links to empty array when not provided', async () => {
    await useCase.execute({ ...baseDto, links: undefined });

    const [userInput] = repo.createWithProfile.mock.calls[0];
    expect(userInput.links).toEqual([]);
  });

  it('passes provided links through', async () => {
    await useCase.execute({ ...baseDto, links: ['https://github.com'] });

    const [userInput] = repo.createWithProfile.mock.calls[0];
    expect(userInput.links).toEqual(['https://github.com']);
  });

  it('passes MENTOR profile input when role is MENTOR and mentorProfile provided', async () => {
    repo.createWithProfile.mockResolvedValue(makeUser(UserRole.MENTOR));

    await useCase.execute({
      ...baseDto,
      role: UserRole.MENTOR,
      mentorProfile: { niche: 'Backend', specialties: ['NestJS'] },
    });

    const [, profileInput] = repo.createWithProfile.mock.calls[0];
    expect(profileInput).toEqual({
      type: 'MENTOR',
      data: { niche: 'Backend', specialties: ['NestJS'] },
    });
  });

  it('passes CLIENT profile input when role is CLIENT and clientProfile provided', async () => {
    await useCase.execute({
      ...baseDto,
      role: UserRole.CLIENT,
      clientProfile: { interests: ['career'] },
    });

    const [, profileInput] = repo.createWithProfile.mock.calls[0];
    expect(profileInput).toEqual({
      type: 'CLIENT',
      data: { interests: ['career'] },
    });
  });

  it('passes null profileInput when role has no matching profile', async () => {
    await useCase.execute({ ...baseDto, role: UserRole.CLIENT });

    const [, profileInput] = repo.createWithProfile.mock.calls[0];
    expect(profileInput).toBeNull();
  });
});
