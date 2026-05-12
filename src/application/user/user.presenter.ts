import { MentorProfile } from 'src/domain/entities/mentor-profile.entity';
import type { User } from 'src/domain/entities/user.entity';
import type { UserProfile } from 'src/domain/repositories/user.repository';

export class UserPresenter {
  static toHTTP(user: User) {
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      role: user.role,
      activityStatus: user.activityStatus,
      links: user.links,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static toHTTPWithProfile(user: User, profile: UserProfile) {
    return {
      ...UserPresenter.toHTTP(user),
      profile: UserPresenter.profileToHTTP(profile),
    };
  }

  private static profileToHTTP(profile: UserProfile) {
    if (!profile) return null;
    if (profile instanceof MentorProfile) {
      return {
        niche: profile.niche,
        specialties: profile.specialties,
      };
    }
    return { interests: profile.interests };
  }
}
