import type { MentorProfile } from 'src/domain/entities/mentor-profile.entity';
import type { User } from 'src/domain/entities/user.entity';

export type MentorListItem = {
  user: User;
  mentorProfile: MentorProfile;
};

export type MentorListResult = {
  items: MentorListItem[];
  total: number;
};

export type MentorFilters = {
  search?: string;
  niche?: string;
  specialties?: string[];
  minPrice?: number;
  maxPrice?: number;
  availableFrom?: Date;
  availableTo?: Date;
  take: number;
  skip: number;
};

export interface MentorRepository {
  findMany(filters: MentorFilters): Promise<MentorListResult>;
  findByIdWithProfile(id: string): Promise<MentorListItem | null>;
}
