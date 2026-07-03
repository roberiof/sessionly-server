import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { ToUtcDate } from 'src/core/transformers/to-utc-date.transformer';
import { AvailabilitySlotType } from 'src/domain/entities/availability-slot.entity';

export class CreateAvailabilitySlotDto {
  @ApiProperty({
    type: String,
    format: 'date-time',
    description:
      'ISO datetime. Naked values (no Z / offset) are interpreted as UTC.',
  })
  @ToUtcDate()
  @IsDate()
  startTime: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description:
      'ISO datetime. Naked values (no Z / offset) are interpreted as UTC.',
  })
  @ToUtcDate()
  @IsDate()
  endTime: Date;

  @ApiProperty({
    enum: AvailabilitySlotType,
    example: AvailabilitySlotType.ADD,
  })
  @IsEnum(AvailabilitySlotType)
  type: AvailabilitySlotType;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Required when type is BLOCK.',
  })
  @ValidateIf(
    (o: CreateAvailabilitySlotDto) => o.type === AvailabilitySlotType.BLOCK,
  )
  @IsUUID()
  @IsNotEmpty()
  ruleId?: string;
}
