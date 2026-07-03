import { Module } from '@nestjs/common';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { MentorController } from './mentor.controller';
import { FetchMentorAvailabilityUseCase } from './use-cases/fetch-mentor-availability.use-case';
import { FetchMentorByIdUseCase } from './use-cases/fetch-mentor-by-id.use-case';
import { FetchMentorsUseCase } from './use-cases/fetch-mentors.use-case';

@Module({
  imports: [InfrastructureModule],
  controllers: [MentorController],
  providers: [
    FetchMentorsUseCase,
    FetchMentorByIdUseCase,
    FetchMentorAvailabilityUseCase,
  ],
})
export class MentorModule {}
