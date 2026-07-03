import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { ToUtcDate } from 'src/core/transformers/to-utc-date.transformer';

export class FetchMentorsDto {
  @ApiPropertyOptional({ description: 'Full-text search on name and bio.' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by mentor niche.' })
  @IsString()
  @IsOptional()
  niche?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated specialties. e.g. "React,Node.js"',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value.split(',').map((s: string) => s.trim())
      : value,
  )
  @IsString({ each: true })
  @IsOptional()
  specialties?: string[];

  @ApiPropertyOptional({ description: 'Minimum hourPrice (inclusive).' })
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum hourPrice (inclusive).' })
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Start of availability window. Requires availableTo.',
  })
  @ValidateIf(
    (o: FetchMentorsDto) =>
      o.availableFrom !== undefined || o.availableTo !== undefined,
  )
  @ToUtcDate()
  @IsDate()
  availableFrom?: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'End of availability window. Requires availableFrom.',
  })
  @ValidateIf(
    (o: FetchMentorsDto) =>
      o.availableFrom !== undefined || o.availableTo !== undefined,
  )
  @ToUtcDate()
  @IsDate()
  availableTo?: Date;

  @ApiPropertyOptional({ default: 20 })
  @Transform(({ value }) => (value !== undefined ? Number(value) : 20))
  @IsNumber()
  @Min(1)
  @IsOptional()
  take?: number = 20;

  @ApiPropertyOptional({ default: 0 })
  @Transform(({ value }) => (value !== undefined ? Number(value) : 0))
  @IsNumber()
  @Min(0)
  @IsOptional()
  skip?: number = 0;
}
