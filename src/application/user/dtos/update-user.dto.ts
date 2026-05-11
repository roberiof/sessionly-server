import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'Ada Lovelace' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Short public bio.' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ format: 'uri', example: 'https://example.com/a.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ type: [String], example: ['https://example.com'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  links?: string[];
}
