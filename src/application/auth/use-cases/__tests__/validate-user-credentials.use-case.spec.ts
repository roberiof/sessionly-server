import { compare } from 'bcryptjs';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { ValidateUserCredentialsUseCase } from '../validate-user-credentials.use-case';

jest.mock('bcryptjs', () => ({ compare: jest.fn() }));

const mockCompare = compare as jest.MockedFunction<typeof compare>;

function makeRepo(
  overrides?: Partial<
    jest.Mocked<Pick<UserRepository, 'findCredentialsByEmail'>>
  >,
): jest.Mocked<Pick<UserRepository, 'findCredentialsByEmail'>> {
  return {
    findCredentialsByEmail: jest.fn(),
    ...overrides,
  } as jest.Mocked<Pick<UserRepository, 'findCredentialsByEmail'>>;
}

describe('ValidateUserCredentialsUseCase', () => {
  let useCase: ValidateUserCredentialsUseCase;
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new ValidateUserCredentialsUseCase(
      repo as unknown as UserRepository,
    );
    mockCompare.mockReset();
  });

  it('returns null when email not found', async () => {
    repo.findCredentialsByEmail.mockResolvedValue(null);

    const result = await useCase.execute({
      email: 'x@x.com',
      password: 'pass',
    });

    expect(result).toBeNull();
    expect(mockCompare).not.toHaveBeenCalled();
  });

  it('returns null when password does not match', async () => {
    repo.findCredentialsByEmail.mockResolvedValue({
      id: 'u1',
      passwordHash: 'hash',
    });
    mockCompare.mockResolvedValue(false as never);

    const result = await useCase.execute({
      email: 'x@x.com',
      password: 'wrong',
    });

    expect(result).toBeNull();
  });

  it('returns userId when credentials are valid', async () => {
    repo.findCredentialsByEmail.mockResolvedValue({
      id: 'u1',
      passwordHash: 'hash',
    });
    mockCompare.mockResolvedValue(true as never);

    const result = await useCase.execute({
      email: 'x@x.com',
      password: 'correct',
    });

    expect(result).toEqual({ userId: 'u1' });
    expect(mockCompare).toHaveBeenCalledWith('correct', 'hash');
  });
});
