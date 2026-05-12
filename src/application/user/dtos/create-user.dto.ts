import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ActivityStatus, UserRole } from 'src/domain/entities/user.entity';

export class CreateMentorProfileDto {
  @ApiProperty({ example: 'Software Engineering' })
  @IsString()
  @IsNotEmpty()
  niche: string;

  @ApiProperty({ type: [String], example: ['NestJS', 'TypeScript'] })
  @IsArray()
  @IsString({ each: true })
  specialties: string[];
}

export class CreateClientProfileDto {
  @ApiProperty({ type: [String], example: ['backend', 'career'] })
  @IsArray()
  @IsString({ each: true })
  interests: string[];
}

export class CreateUserDto {
  @ApiProperty({ example: 'Ada Lovelace' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Short public bio.' })
  @IsString()
  @IsNotEmpty()
  bio: string;

  @ApiProperty({ format: 'email', example: 'ada@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ format: 'password', minLength: 1 })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ format: 'uri', example: 'https://example.com/a.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CLIENT })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ enum: ActivityStatus, example: ActivityStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ActivityStatus)
  activityStatus?: ActivityStatus;

  @ApiPropertyOptional({ type: [String], example: ['https://example.com'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  links?: string[];

  @ApiPropertyOptional({ type: () => CreateMentorProfileDto })
  @ValidateIf((o: CreateUserDto) => o.role === UserRole.MENTOR)
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => CreateMentorProfileDto)
  mentorProfile?: CreateMentorProfileDto;

  @ApiPropertyOptional({ type: () => CreateClientProfileDto })
  @ValidateIf((o: CreateUserDto) => o.role === UserRole.CLIENT)
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => CreateClientProfileDto)
  clientProfile?: CreateClientProfileDto;
}
