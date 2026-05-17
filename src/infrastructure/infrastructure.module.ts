import { Module } from '@nestjs/common';
import {
  PASSWORD_RESET_TOKENS_REPOSITORY,
  REFRESH_TOKENS_REPOSITORY,
  USERS_REPOSITORY,
} from 'src/domain/repositories/tokens';
import { EmailService } from './email/email.service';
import { ClientProfileMapper } from './database/mappers/client-profile.mapper';
import { MentorProfileMapper } from './database/mappers/mentor-profile.mapper';
import { UserMapper } from './database/mappers/user.mapper';
import { PrismaModule } from './database/prisma/prisma.module';
import { PrismaPasswordResetTokenRepository } from './database/repositories/prisma-password-reset-token.repository';
import { PrismaRefreshTokenRepository } from './database/repositories/prisma-refresh-token.repository';
import { PrismaUserRepository } from './database/repositories/prisma-user.repository';

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
];

@Module({
  imports: [PrismaModule],
  providers: [
    ...REPOSITORIES,
    UserMapper,
    MentorProfileMapper,
    ClientProfileMapper,
    EmailService,
  ],
  exports: [...REPOSITORIES, EmailService],
})
export class InfrastructureModule {}
