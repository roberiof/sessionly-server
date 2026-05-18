import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
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
  ApiUsersUpdateMeDocs,
} from './user-http.decorator';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { DeleteUserMeUseCase } from './use-cases/delete-user-me.use-case';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UpdateUserMeUseCase } from './use-cases/update-user-me.use-case';
import { FetchUserMeUseCase } from './use-cases/fetch-user-me.use-case';

@ApiUsersController()
@Controller('users')
export class UserController {
  constructor(
    private readonly fetchUserMeUseCase: FetchUserMeUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly deleteUserMeUseCase: DeleteUserMeUseCase,
    private readonly updateUserMeUseCase: UpdateUserMeUseCase,
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
}
