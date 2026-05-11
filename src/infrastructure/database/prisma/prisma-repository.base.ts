import { ConfigService } from '@nestjs/config';
import type { PaginationParams } from 'src/core/types/pagination';

const DEFAULT_PAGE_SIZE = 10;

export abstract class PrismaRepositoryBase {
  protected constructor(protected readonly configService: ConfigService) {}

  protected resolvePagination(params: PaginationParams): {
    take: number;
    skip: number;
  } {
    const configured = this.configService.get<number>(
      'PAGINATION_DEFAULT_TAKE',
    );
    const defaultTake =
      typeof configured === 'number' && configured > 0
        ? configured
        : DEFAULT_PAGE_SIZE;

    return {
      take: params.take ?? defaultTake,
      skip: params.skip ?? 0,
    };
  }
}
