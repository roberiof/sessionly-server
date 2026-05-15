import type { PaginatedResult } from 'src/core/types/pagination';
import type {
  UserRepository,
  UserWithProfile,
} from 'src/domain/repositories/user.repository';
import { FetchUsersUseCase } from '../fetch-users.use-case';

function makeRepo(): jest.Mocked<Pick<UserRepository, 'findManyWithProfile'>> {
  return { findManyWithProfile: jest.fn() };
}

const emptyPage: PaginatedResult<UserWithProfile> = {
  data: [],
  total: 0,
  take: 10,
  skip: 0,
};

describe('FetchUsersUseCase', () => {
  let useCase: FetchUsersUseCase;
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    repo = makeRepo();
    repo.findManyWithProfile.mockResolvedValue(emptyPage);
    useCase = new FetchUsersUseCase(repo as unknown as UserRepository);
  });

  it('delegates to findManyWithProfile with provided params', async () => {
    await useCase.execute({ take: 5, skip: 10 });

    expect(repo.findManyWithProfile).toHaveBeenCalledWith({
      take: 5,
      skip: 10,
    });
  });

  it('defaults take to 10 and skip to 0 when not provided', async () => {
    await useCase.execute({});

    expect(repo.findManyWithProfile).toHaveBeenCalledWith({
      take: 10,
      skip: 0,
    });
  });

  it('returns the PaginatedResult from the repository', async () => {
    const page: PaginatedResult<UserWithProfile> = {
      data: [],
      total: 42,
      take: 10,
      skip: 0,
    };
    repo.findManyWithProfile.mockResolvedValue(page);

    const result = await useCase.execute({});

    expect(result).toBe(page);
  });
});
