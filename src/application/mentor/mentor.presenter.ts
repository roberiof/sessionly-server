import type { AvailabilitySlot } from 'src/domain/entities/availability-slot.entity';
import type { MentorProfile } from 'src/domain/entities/mentor-profile.entity';
import type { User } from 'src/domain/entities/user.entity';
import type { MentorListItem } from 'src/domain/repositories/mentor.repository';
import { AvailabilitySlotPresenter } from '../availability/availability.presenter';

export class MentorPresenter {
  static toHTTP(user: User, mentorProfile: MentorProfile) {
    return {
      id: user.id.toString(),
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      activityStatus: user.activityStatus,
      links: user.links,
      profile: {
        niche: mentorProfile.niche,
        specialties: mentorProfile.specialties,
        chatPrice: mentorProfile.chatPrice,
        hourPrice: mentorProfile.hourPrice,
      },
    };
  }

  static toHTTPList(items: MentorListItem[]) {
    return items.map((item) =>
      MentorPresenter.toHTTP(item.user, item.mentorProfile),
    );
  }

  static toHTTPWithAvailabilityPreview(
    user: User,
    mentorProfile: MentorProfile,
    availabilityPreview: AvailabilitySlot[],
  ) {
    return {
      ...MentorPresenter.toHTTP(user, mentorProfile),
      availabilityPreview: availabilityPreview.map((slot) =>
        AvailabilitySlotPresenter.toHTTP(slot),
      ),
    };
  }
}
