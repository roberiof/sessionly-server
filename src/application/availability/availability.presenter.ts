import { AvailabilityRules } from 'src/domain/entities/availability-rules.entity';
import type { AvailabilitySlot } from 'src/domain/entities/availability-slot.entity';

export class AvailabilitySlotPresenter {
  static toHTTP(slot: AvailabilitySlot) {
    return {
      id: slot.id.toString(),
      mentorId: slot.mentorId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      type: slot.type,
      ruleId: slot.ruleId,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    };
  }
}

export class AvailabilityRulesPresenter {
  static toHTTP(rules: AvailabilityRules) {
    return {
      id: rules.id.toString(),
      mentorId: rules.mentorId,
      days: rules.days,
      createdAt: rules.createdAt,
      updatedAt: rules.updatedAt,
    };
  }
}
