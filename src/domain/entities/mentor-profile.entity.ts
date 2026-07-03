import { Entity, EntityMetadata } from 'src/core/entities/entity';

export interface MentorProfileProps {
  niche: string;
  specialties: string[];
  chatPrice: number | null;
  hourPrice: number | null;
}

export class MentorProfile extends Entity<MentorProfileProps> {
  get niche(): string {
    return this.props.niche;
  }

  get specialties(): string[] {
    return this.props.specialties;
  }

  get chatPrice(): number | null {
    return this.props.chatPrice;
  }

  get hourPrice(): number | null {
    return this.props.hourPrice;
  }

  get isProfileComplete(): boolean {
    return (
      !!this.props.niche &&
      !!this.props.hourPrice &&
      this.props.specialties.length > 0
    );
  }

  static create(
    props: MentorProfileProps & Partial<EntityMetadata>,
  ): MentorProfile {
    return new MentorProfile(props);
  }
}
