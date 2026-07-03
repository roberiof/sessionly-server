import { Inject, Injectable } from '@nestjs/common';
import type {
  MentorListResult,
  MentorRepository,
} from 'src/domain/repositories/mentor.repository';
import { MENTOR_REPOSITORY } from 'src/domain/repositories/tokens';
import { FetchMentorsDto } from '../dtos/fetch-mentors.dto';

@Injectable()
export class FetchMentorsUseCase {
  constructor(
    @Inject(MENTOR_REPOSITORY)
    private readonly mentorRepository: MentorRepository,
  ) {}

  async execute(params: FetchMentorsDto): Promise<MentorListResult> {
    return this.mentorRepository.findMany({
      search: params.search,
      niche: params.niche,
      specialties: params.specialties,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      availableFrom: params.availableFrom,
      availableTo: params.availableTo,
      take: params.take ?? 20,
      skip: params.skip ?? 0,
    });
  }
}
