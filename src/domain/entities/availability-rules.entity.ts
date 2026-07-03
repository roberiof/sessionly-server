import { Entity, EntityMetadata } from 'src/core/entities/entity';

export interface AvailabilityRulesProps {
  mentorId: string;
  days: {
    weekday: number; // 0 (Sunday) to 6 (Saturday)
    timeRanges: {
      startTime: string; // "HH:mm" format
      endTime: string; // "HH:mm" format
    }[];
  }[];
}

export class AvailabilityRules extends Entity<AvailabilityRulesProps> {
  get mentorId(): string {
    return this.props.mentorId;
  }

  get days(): AvailabilityRulesProps['days'] {
    return this.props.days;
  }

  static create(
    props: AvailabilityRulesProps & Partial<EntityMetadata>,
  ): AvailabilityRules {
    return new AvailabilityRules(props);
  }
}
