import { Module } from '@nestjs/common';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { AuthModule } from '../auth/auth.module';
import { AvailabilityController } from './availability.controller';
import { CreateAvailabilitySlotsMeUseCase } from './use-cases/create-availability-slots-me.use-case';
import { DeleteAvailabilitySlotsMeUseCase } from './use-cases/delete-availability-slots-me';
import { UpdateAvailabilityRulesMeUseCase } from './use-cases/update-availability-rules-me.use-case';
import { FetchAvailabilityMeUseCase } from './use-cases/fetch-availability-me.use-case';

@Module({
  imports: [InfrastructureModule, AuthModule],
  controllers: [AvailabilityController],
  providers: [
    CreateAvailabilitySlotsMeUseCase,
    UpdateAvailabilityRulesMeUseCase,
    DeleteAvailabilitySlotsMeUseCase,
    FetchAvailabilityMeUseCase,
  ],
})
export class AvailabilityModule {}
