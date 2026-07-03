import type {
  MentorListResult,
  MentorRepository,
} from 'src/domain/repositories/mentor.repository';
import { FetchMentorsDto } from '../dtos/fetch-mentors.dto';
import { FetchMentorsUseCase } from './fetch-mentors.use-case';

function makeRepo(): jest.Mocked<Pick<MentorRepository, 'findMany'>> {
  return { findMany: jest.fn() };
}

const emptyResult: MentorListResult = { items: [], total: 0 };

describe('FetchMentorsUseCase', () => {
  let useCase: FetchMentorsUseCase;
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    repo = makeRepo();
    repo.findMany.mockResolvedValue(emptyResult);
    useCase = new FetchMentorsUseCase(repo as unknown as MentorRepository);
  });

  it('delegates to repository and returns result', async () => {
    const dto = { take: 10, skip: 0 } as FetchMentorsDto;

    const result = await useCase.execute(dto);

    expect(repo.findMany).toHaveBeenCalledTimes(1);
    expect(result).toBe(emptyResult);
  });

  it('uses default take=20 and skip=0 when not provided', async () => {
    await useCase.execute({});

    const [filters] = repo.findMany.mock.calls[0];
    expect(filters.take).toBe(20);
    expect(filters.skip).toBe(0);
  });

  it('passes provided take and skip through', async () => {
    await useCase.execute({ take: 5, skip: 40 });

    const [filters] = repo.findMany.mock.calls[0];
    expect(filters.take).toBe(5);
    expect(filters.skip).toBe(40);
  });

  it('passes search, niche, specialties, price range and availability filters', async () => {
    const from = new Date('2026-06-01T00:00:00Z');
    const to = new Date('2026-06-07T00:00:00Z');

    await useCase.execute({
      search: 'typescript',
      niche: 'backend',
      specialties: ['NestJS', 'Prisma'],
      minPrice: 50,
      maxPrice: 200,
      availableFrom: from,
      availableTo: to,
      take: 10,
      skip: 0,
    });

    const [filters] = repo.findMany.mock.calls[0];
    expect(filters.search).toBe('typescript');
    expect(filters.niche).toBe('backend');
    expect(filters.specialties).toEqual(['NestJS', 'Prisma']);
    expect(filters.minPrice).toBe(50);
    expect(filters.maxPrice).toBe(200);
    expect(filters.availableFrom).toBe(from);
    expect(filters.availableTo).toBe(to);
  });

  it('passes undefined optional filters when not provided', async () => {
    await useCase.execute({ take: 10, skip: 0 });

    const [filters] = repo.findMany.mock.calls[0];
    expect(filters.search).toBeUndefined();
    expect(filters.niche).toBeUndefined();
    expect(filters.specialties).toBeUndefined();
    expect(filters.minPrice).toBeUndefined();
    expect(filters.maxPrice).toBeUndefined();
    expect(filters.availableFrom).toBeUndefined();
    expect(filters.availableTo).toBeUndefined();
  });
});
