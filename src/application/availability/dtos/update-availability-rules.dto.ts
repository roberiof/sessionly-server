import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class TimeRangeDto {
  @ApiProperty({ example: '09:00', pattern: HH_MM.source })
  @Matches(HH_MM, { message: 'startTime must be in HH:mm format.' })
  startTime: string;

  @ApiProperty({ example: '12:00', pattern: HH_MM.source })
  @Matches(HH_MM, { message: 'endTime must be in HH:mm format.' })
  endTime: string;
}

export class AvailabilityDayDto {
  @ApiProperty({
    minimum: 0,
    maximum: 6,
    description: '0 (Sunday) to 6 (Saturday).',
  })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number;

  @ApiProperty({ type: [TimeRangeDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TimeRangeDto)
  timeRanges: TimeRangeDto[];
}

export class UpdateAvailabilityRulesDto {
  @ApiProperty({ type: [AvailabilityDayDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AvailabilityDayDto)
  days: AvailabilityDayDto[];
}
