import { Entity, EntityMetadata } from 'src/core/entities/entity';

export interface MentorProfileProps {
  niche: string;
  specialties: string[];
  chatPrice: number;
}

export class MentorProfile extends Entity<MentorProfileProps> {
  get niche(): string {
    return this.props.niche;
  }

  get specialties(): string[] {
    return this.props.specialties;
  }

  get chatPrice(): number {
    return this.props.chatPrice;
  }

  static create(
    props: MentorProfileProps & Partial<EntityMetadata>,
  ): MentorProfile {
    return new MentorProfile(props);
  }
}
