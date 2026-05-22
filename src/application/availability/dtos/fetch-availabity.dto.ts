import { ApiProperty } from '@nestjs/swagger';
import { IsDate } from 'class-validator';
import { ToUtcDate } from 'src/core/transformers/to-utc-date.transformer';

export class FetchAvailabilitySlotDto {
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'ISO datetime. Naked values interpreted as UTC.',
  })
  @ToUtcDate()
  @IsDate()
  from: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'ISO datetime. Naked values interpreted as UTC.',
  })
  @ToUtcDate()
  @IsDate()
  to: Date;
}
