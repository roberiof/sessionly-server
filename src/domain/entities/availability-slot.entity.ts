import { Entity, EntityMetadata } from 'src/core/entities/entity';

export enum AvailabilitySlotType {
  BLOCK = 'BLOCK',
  ADD = 'ADD',
}

export interface AvailabilitySlotProps {
  mentorId: string;
  startTime: Date;
  endTime: Date;
  type: AvailabilitySlotType;
  ruleId: string | null;
}

export class AvailabilitySlot extends Entity<AvailabilitySlotProps> {
  get mentorId(): string {
    return this.props.mentorId;
  }

  get startTime(): Date {
    return this.props.startTime;
  }

  get endTime(): Date {
    return this.props.endTime;
  }

  get type(): AvailabilitySlotType {
    return this.props.type;
  }

  get ruleId(): string | null {
    return this.props.ruleId;
  }

  static create(
    props: AvailabilitySlotProps & Partial<EntityMetadata>,
  ): AvailabilitySlot {
    return new AvailabilitySlot(props);
  }
}
