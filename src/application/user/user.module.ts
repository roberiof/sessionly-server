import { Module } from '@nestjs/common';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { UserController } from './user.controller';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { FetchUserMeUseCase } from './use-cases/fetch-user-me.use-case';
import { DeleteUserMeUseCase } from './use-cases/delete-user-me.use-case';
import { UpdateUserMeUseCase } from './use-cases/update-user-me.use-case';
import { UpdateUserPasswordMeUseCase } from './use-cases/update-user-password-me.use-case';
import { RestoreUserMeUseCase } from './use-cases/restore-user-me.use-case';
import { UploadAvatarUseCase } from '../uploads/use-cases/upload-avatar.use-case';

@Module({
  imports: [InfrastructureModule],
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    FetchUserMeUseCase,
    UpdateUserMeUseCase,
    DeleteUserMeUseCase,
    UpdateUserPasswordMeUseCase,
    RestoreUserMeUseCase,
    UploadAvatarUseCase,
  ],
})
export class UserModule {}
