import { Controller, Get, Param, Query } from '@nestjs/common';
import { FetchAvailabilitySlotDto } from 'src/application/availability/dtos/fetch-availabity.dto';
import { RESPONSE } from 'src/core/response/response.messages';
import { AvailabilityRulesPresenter } from '../availability/availability.presenter';
import { FetchMentorsDto } from './dtos/fetch-mentors.dto';
import {
  ApiMentorsController,
  ApiMentorsFetchAvailabilityDocs,
  ApiMentorsFetchByIdDocs,
  ApiMentorsFetchManyDocs,
} from './mentor-http.decorator';
import { MentorPresenter } from './mentor.presenter';
import { FetchMentorAvailabilityUseCase } from './use-cases/fetch-mentor-availability.use-case';
import { FetchMentorByIdUseCase } from './use-cases/fetch-mentor-by-id.use-case';
import { FetchMentorsUseCase } from './use-cases/fetch-mentors.use-case';

@ApiMentorsController()
@Controller('mentors')
export class MentorController {
  constructor(
    private readonly fetchMentorsUseCase: FetchMentorsUseCase,
    private readonly fetchMentorByIdUseCase: FetchMentorByIdUseCase,
    private readonly fetchMentorAvailabilityUseCase: FetchMentorAvailabilityUseCase,
  ) {}

  @Get()
  @ApiMentorsFetchManyDocs()
  async findMany(@Query() query: FetchMentorsDto) {
    const result = await this.fetchMentorsUseCase.execute(query);

    return {
      message: RESPONSE.MENTORS.FETCHED_SUCCESSFULLY,
      data: {
        mentors: MentorPresenter.toHTTPList(result.items),
        total: result.total,
        take: query.take ?? 20,
        skip: query.skip ?? 0,
      },
    };
  }

  @Get(':id')
  @ApiMentorsFetchByIdDocs()
  async findById(@Param('id') id: string) {
    const result = await this.fetchMentorByIdUseCase.execute(id);

    return {
      message: RESPONSE.MENTORS.FETCHED_SUCCESSFULLY,
      data: {
        mentor: MentorPresenter.toHTTPWithAvailabilityPreview(
          result.user,
          result.mentorProfile,
          result.availabilityPreview,
        ),
      },
    };
  }

  @Get(':id/availability')
  @ApiMentorsFetchAvailabilityDocs()
  async findAvailability(
    @Param('id') id: string,
    @Query() query: FetchAvailabilitySlotDto,
  ) {
    const { slots, rules } = await this.fetchMentorAvailabilityUseCase.execute(
      id,
      query,
    );

    return {
      message: RESPONSE.MENTORS.AVAILABILITY_FETCHED_SUCCESSFULLY,
      data: {
        slots: slots.map((slot) => ({
          id: slot.id.toString(),
          mentorId: slot.mentorId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          type: slot.type,
          ruleId: slot.ruleId,
        })),
        rules: rules ? AvailabilityRulesPresenter.toHTTP(rules) : null,
      },
    };
  }
}
