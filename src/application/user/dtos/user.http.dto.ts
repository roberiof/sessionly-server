import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedListHttpDataDto } from 'src/core/swagger/paginated-list.data.dto';
import { ActivityStatus, UserRole } from 'src/domain/entities/user.entity';

export class MentorProfilePublicDto {
  @ApiProperty()
  niche: string;

  @ApiProperty({ type: [String] })
  specialties: string[];
}

export class ClientProfilePublicDto {
  @ApiProperty({ type: [String] })
  interests: string[];
}

/** Public user shape returned by the HTTP API (not the domain entity). */
export class UserPublicViewDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiPropertyOptional({ nullable: true })
  bio?: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty({ enum: ActivityStatus })
  activityStatus: ActivityStatus;

  @ApiProperty({ type: [String] })
  links: string[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  profile?: MentorProfilePublicDto | ClientProfilePublicDto | null;
}

/** Paginated users payload: same shape as {@link PaginatedResult}. */
export class FetchUsersHttpDataDto extends PaginatedListHttpDataDto {
  @ApiProperty({ type: UserPublicViewDto, isArray: true })
  data: UserPublicViewDto[];
}

export class FetchUsersResponseDto {
  @ApiProperty({ example: 'Users fetched successfully.' })
  message: string;

  @ApiProperty({ type: FetchUsersHttpDataDto })
  data: FetchUsersHttpDataDto;
}

export class CreateUserHttpDataDto {
  @ApiProperty({ type: UserPublicViewDto })
  user: UserPublicViewDto;
}

export class CreateUserResponseDto {
  @ApiProperty({ example: 'User created successfully.' })
  message: string;

  @ApiProperty({ type: CreateUserHttpDataDto })
  data: CreateUserHttpDataDto;
}
