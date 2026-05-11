import { ApiProperty } from '@nestjs/swagger';

/**
 * Shared OpenAPI fields for paginated list payloads (matches {@link PaginatedResult} shape).
 */
export class PaginatedListHttpDataDto {
  @ApiProperty({ minimum: 0, example: 42 })
  total: number;

  @ApiProperty({ minimum: 0, example: 10 })
  take: number;

  @ApiProperty({ minimum: 0, example: 0 })
  skip: number;
}
