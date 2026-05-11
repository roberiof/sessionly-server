import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/application/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RESPONSE } from 'src/core/response/response.messages';
import { CreateUserDto } from './dtos/create-user.dto';
import { FetchUsersQueryDto } from './dtos/fetch-users.dto';
import { UserPresenter } from './user.presenter';
import {
  ApiUsersController,
  ApiUsersCreateDocs,
  ApiUsersDeleteDocs,
  ApiUsersListDocs,
  ApiUsersUpdateDocs,
} from './user-http.decorator';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { DeleteUserUseCase } from './use-cases/delete-user.use-case';
import { FetchUsersUseCase } from './use-cases/fetch-users.use-case';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';

@ApiUsersController()
@Controller('users')
export class UserController {
  constructor(
    private readonly fetchUsersUseCase: FetchUsersUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiUsersListDocs()
  async fetch(@Query() query: FetchUsersQueryDto) {
    const result = await this.fetchUsersUseCase.execute(query);

    return {
      message: RESPONSE.USERS.FETCHED_SUCCESSFULLY,
      data: result.data.map((item) =>
        UserPresenter.toHTTPWithProfile(item.user, item.profile),
      ),
      total: result.total,
      take: result.take,
      skip: result.skip,
    };
  }

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
  @Delete(':id')
  @ApiUsersDeleteDocs()
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.deleteUserUseCase.execute(id, user.userId);

    return {
      message: RESPONSE.USERS.DELETED_SUCCESSFULLY,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiUsersUpdateDocs()
  async update(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() user: { userId: string },
  ) {
    const result = await this.updateUserUseCase.execute(id, body, user.userId);

    return {
      message: RESPONSE.USERS.UPDATED_SUCCESSFULLY,
      data: {
        user: UserPresenter.toHTTP(result),
      },
    };
  }
}
