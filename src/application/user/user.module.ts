import { Module } from '@nestjs/common';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { UserController } from './user.controller';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { FetchUsersUseCase } from './use-cases/fetch-users.use-case';
import { DeleteUserUseCase } from './use-cases/delete-user-me.use-case';
import { UpdateUserUseCase } from './use-cases/update-user-me.use-case';

@Module({
  imports: [InfrastructureModule],
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    FetchUsersUseCase,
    DeleteUserUseCase,
    UpdateUserUseCase,
  ],
})
export class UserModule {}
