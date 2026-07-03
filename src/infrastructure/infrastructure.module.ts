import { Module } from '@nestjs/common';
import {
  AVAILABILITY_RULES_REPOSITORY,
  AVAILABILITY_SLOT_REPOSITORY,
  MENTOR_REPOSITORY,
  PASSWORD_RESET_TOKENS_REPOSITORY,
  REFRESH_TOKENS_REPOSITORY,
  USERS_REPOSITORY,
} from 'src/domain/repositories/tokens';
import { EmailService } from './email/email.service';
import { S3Service } from './storage/s3.service';
import { AvailabilityRulesMapper } from './database/mappers/availability-rules.mapper';
import { AvailabilitySlotMapper } from './database/mappers/availability-slot.mapper';
import { ClientProfileMapper } from './database/mappers/client-profile.mapper';
import { MentorProfileMapper } from './database/mappers/mentor-profile.mapper';
import { UserMapper } from './database/mappers/user.mapper';
import { PrismaModule } from './database/prisma/prisma.module';
import { PrismaAvailabilityRulesRepository } from './database/repositories/prisma-availability-rules.repository';
import { PrismaAvailabilitySlotRepository } from './database/repositories/prisma-availability-slot.repository';
import { PrismaPasswordResetTokenRepository } from './database/repositories/prisma-password-reset-token.repository';
import { PrismaRefreshTokenRepository } from './database/repositories/prisma-refresh-token.repository';
import { PrismaUserRepository } from './database/repositories/prisma-user.repository';
import { PrismaMentorRepository } from './database/repositories/prisma-mentor.repository';

const REPOSITORIES = [
  {
    provide: USERS_REPOSITORY,
    useClass: PrismaUserRepository,
  },
  {
    provide: REFRESH_TOKENS_REPOSITORY,
    useClass: PrismaRefreshTokenRepository,
  },
  {
    provide: PASSWORD_RESET_TOKENS_REPOSITORY,
    useClass: PrismaPasswordResetTokenRepository,
  },
  {
    provide: AVAILABILITY_SLOT_REPOSITORY,
    useClass: PrismaAvailabilitySlotRepository,
  },
  {
    provide: AVAILABILITY_RULES_REPOSITORY,
    useClass: PrismaAvailabilityRulesRepository,
  },
  {
    provide: MENTOR_REPOSITORY,
    useClass: PrismaMentorRepository,
  },
];

@Module({
  imports: [PrismaModule],
  providers: [
    ...REPOSITORIES,
    UserMapper,
    MentorProfileMapper,
    ClientProfileMapper,
    AvailabilitySlotMapper,
    AvailabilityRulesMapper,
    EmailService,
    S3Service,
  ],
  exports: [...REPOSITORIES, EmailService, S3Service],
})
export class InfrastructureModule {}
