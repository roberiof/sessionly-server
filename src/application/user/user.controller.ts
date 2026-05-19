import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from 'src/application/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RESPONSE } from 'src/core/response/response.messages';
import { CreateUserDto } from './dtos/create-user.dto';
import { UserPresenter } from './user.presenter';
import {
  ApiUsersController,
  ApiUsersCreateDocs,
  ApiUsersDeleteMeDocs,
  ApiUsersFetchMeDocs,
  ApiUsersRestoreMeDocs,
  ApiUsersUpdateMeDocs,
  ApiUsersUpdatePasswordDocs,
  ApiUsersUploadAvatarDocs,
} from './user-http.decorator';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { DeleteUserMeUseCase } from './use-cases/delete-user-me.use-case';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UpdateUserPasswordDto } from './dtos/update-user-password.dto';
import { UpdateUserMeUseCase } from './use-cases/update-user-me.use-case';
import { FetchUserMeUseCase } from './use-cases/fetch-user-me.use-case';
import { UpdateUserPasswordMeUseCase } from './use-cases/update-user-password-me.use-case';
import { RestoreUserMeUseCase } from './use-cases/restore-user-me.use-case';
import { UploadAvatarUseCase } from '../uploads/use-cases/upload-avatar.use-case';

type MultipartRequest = FastifyRequest & {
  file: () => Promise<{
    mimetype: string;
    toBuffer: () => Promise<Buffer>;
  }>;
};

@ApiUsersController()
@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly fetchUserMeUseCase: FetchUserMeUseCase,
    private readonly deleteUserMeUseCase: DeleteUserMeUseCase,
    private readonly updateUserMeUseCase: UpdateUserMeUseCase,
    private readonly updateUserPasswordMeUseCase: UpdateUserPasswordMeUseCase,
    private readonly restoreUserMeUseCase: RestoreUserMeUseCase,
    private readonly uploadAvatarUseCase: UploadAvatarUseCase,
  ) {}

  @Post()
  @ApiUsersCreateDocs()
  async create(@Body() body: CreateUserDto) {
    const result = await this.createUserUseCase.execute(body);

    return {
      message: RESPONSE.USERS.CREATED_SUCCESSFULLY,
      data: {
        user: UserPresenter.toHTTPWithProfile(result.user, result.profile),
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiUsersFetchMeDocs()
  async fetchMe(@CurrentUser() user: { userId: string }) {
    const result = await this.fetchUserMeUseCase.execute(user.userId);

    return {
      message: RESPONSE.USERS.FETCHED_SUCCESSFULLY,
      data: {
        user: UserPresenter.toHTTPWithProfile(result.user, result.profile),
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @ApiUsersDeleteMeDocs()
  async deleteMe(@CurrentUser() user: { userId: string }) {
    await this.deleteUserMeUseCase.execute(user.userId);

    return {
      message: RESPONSE.USERS.DELETED_SUCCESSFULLY,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiUsersUpdateMeDocs()
  async updateMe(
    @Body() body: UpdateUserDto,
    @CurrentUser() user: { userId: string },
  ) {
    const result = await this.updateUserMeUseCase.execute(user.userId, body);

    return {
      message: RESPONSE.USERS.UPDATED_SUCCESSFULLY,
      data: {
        user: UserPresenter.toHTTP(result),
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  @ApiUsersUpdatePasswordDocs()
  async updateUserPassword(
    @Body() body: UpdateUserPasswordDto,
    @CurrentUser() user: { userId: string },
  ) {
    await this.updateUserPasswordMeUseCase.execute(
      user.userId,
      body.currentPassword,
      body.newPassword,
    );

    return {
      message: RESPONSE.USERS.PASSWORD_UPDATED_SUCCESSFULLY,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/restore')
  @ApiUsersRestoreMeDocs()
  async restoreMe(@CurrentUser() user: { userId: string }) {
    await this.restoreUserMeUseCase.execute(user.userId);

    return {
      message: RESPONSE.USERS.RESTORED_SUCCESSFULLY,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @ApiUsersUploadAvatarDocs()
  async uploadAvatar(
    @Req() req: MultipartRequest,
    @CurrentUser() user: { userId: string },
  ) {
    const part = await req.file();
    if (!part) throw new BadRequestException('No file uploaded');
    const buffer = await part.toBuffer();

    const result = await this.uploadAvatarUseCase.execute({
      userId: user.userId,
      buffer,
      mimetype: part.mimetype,
      size: buffer.byteLength,
    });

    return {
      message: RESPONSE.USERS.AVATAR_UPLOADED_SUCCESSFULLY,
      data: { url: result.url },
    };
  }
}
