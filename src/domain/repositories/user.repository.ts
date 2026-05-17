import type {
  PaginatedResult,
  PaginationParams,
} from 'src/core/types/pagination';
import type { ClientProfile } from 'src/domain/entities/client-profile.entity';
import type { MentorProfile } from 'src/domain/entities/mentor-profile.entity';
import type {
  ActivityStatus,
  User,
  UserRole,
} from 'src/domain/entities/user.entity';

export type CreateUserPersistenceInput = {
  name: string;
  email: string;
  bio: string;
  avatarUrl?: string;
  links?: string[];
  passwordHash: string;
  role: UserRole;
  activityStatus?: ActivityStatus;
};

export type UpdateUserPersistenceInput = {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  links?: string[];
};

export type CreateMentorProfilePersistenceInput = {
  niche: string;
  specialties: string[];
};

export type CreateClientProfilePersistenceInput = {
  interests: string[];
};

export type CreateProfilePersistenceInput =
  | { type: 'MENTOR'; data: CreateMentorProfilePersistenceInput }
  | { type: 'CLIENT'; data: CreateClientProfilePersistenceInput }
  | null;

export type UserProfile = MentorProfile | ClientProfile | null;

export type UserWithProfile = {
  user: User;
  profile: UserProfile;
};

export type UserCredentialsRecord = {
  id: string;
  passwordHash: string;
};

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findMany(params: PaginationParams): Promise<PaginatedResult<User>>;
  findByEmail(email: string): Promise<User | null>;
  findCredentialsByEmail(email: string): Promise<UserCredentialsRecord | null>;
  create(input: CreateUserPersistenceInput): Promise<User>;
  deleteById(id: string): Promise<void>;
  updateById(id: string, data: UpdateUserPersistenceInput): Promise<User>;
  updatePasswordById(id: string, passwordHash: string): Promise<void>;
  createWithProfile(
    userInput: CreateUserPersistenceInput,
    profileInput: CreateProfilePersistenceInput,
  ): Promise<UserWithProfile>;
  findByIdWithProfile(id: string): Promise<UserWithProfile | null>;
  findManyWithProfile(
    params: PaginationParams,
  ): Promise<PaginatedResult<UserWithProfile>>;
}
