import { Module } from '@nestjs/common';
import {
  REFRESH_TOKENS_REPOSITORY,
  USERS_REPOSITORY,
} from 'src/domain/repositories/tokens';
import { ClientProfileMapper } from './database/mappers/client-profile.mapper';
import { MentorProfileMapper } from './database/mappers/mentor-profile.mapper';
import { UserMapper } from './database/mappers/user.mapper';
import { PrismaModule } from './database/prisma/prisma.module';
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
];

@Module({
  imports: [PrismaModule],
  providers: [
    ...REPOSITORIES,
    UserMapper,
    MentorProfileMapper,
    ClientProfileMapper,
  ],
  exports: [...REPOSITORIES],
})
export class InfrastructureModule {}
