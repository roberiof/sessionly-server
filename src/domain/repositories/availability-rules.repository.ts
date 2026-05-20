import {
  AvailabilityRules,
  AvailabilityRulesProps,
} from '../entities/availability-rules.entity';

export type UpdateAvalabilityRulesInput = Pick<AvailabilityRulesProps, 'days'>;
export type CreateAvalabilityRulesInput = AvailabilityRulesProps;

export interface AvailabilityRulesRepository {
  findByMentorId(mentorId: string): Promise<AvailabilityRules | null>;
  updateByMentorId(
    mentorId: string,
    input: UpdateAvalabilityRulesInput,
  ): Promise<AvailabilityRules>;
  create(input: CreateAvalabilityRulesInput): Promise<AvailabilityRules>;
  upsertByMentorId(
    input: CreateAvalabilityRulesInput,
  ): Promise<AvailabilityRules>;
}
