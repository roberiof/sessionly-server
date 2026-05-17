import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { RESPONSE } from 'src/core/response/response.messages';
import {
  ApiAuthController,
  ApiAuthForgotPasswordDocs,
  ApiAuthLoginDocs,
  ApiAuthLogoutDocs,
  ApiAuthRefreshDocs,
  ApiAuthResetPasswordDocs,
} from './auth-http.decorator';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ForgotPasswordUseCase } from './use-cases/forgot-password.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { RefreshSessionUseCase } from './use-cases/refresh-session.use-case';
import { ResetPasswordUseCase } from './use-cases/reset-password.use-case';
import { SignTokensUseCase } from './use-cases/sign-tokens.use-case';

type AuthenticatedRequest = FastifyRequest & {
  user: { userId: string };
};

@ApiAuthController()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly signTokensUseCase: SignTokensUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiAuthLoginDocs()
  async login(@Req() req: AuthenticatedRequest) {
    const tokens = await this.signTokensUseCase.execute({
      userId: req.user.userId,
    });

    return {
      message: RESPONSE.AUTH.LOGIN_SUCCESS,
      data: tokens,
    };
  }

  @Post('refresh')
  @ApiAuthRefreshDocs()
  async refresh(@Body() body: RefreshTokenDto) {
    const tokens = await this.refreshSessionUseCase.execute({
      refreshToken: body.refreshToken,
    });

    return {
      message: RESPONSE.AUTH.REFRESH_SUCCESS,
      data: tokens,
    };
  }

  @Post('logout')
  @ApiAuthLogoutDocs()
  async logout(@Body() body: RefreshTokenDto) {
    await this.logoutUseCase.execute({
      refreshToken: body.refreshToken,
    });

    return {
      message: RESPONSE.AUTH.LOGOUT_SUCCESS,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAuthForgotPasswordDocs()
  async forgotPassword(@Body() body: ForgotPasswordDto): Promise<void> {
    await this.forgotPasswordUseCase.execute({ email: body.email });
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAuthResetPasswordDocs()
  async resetPassword(@Body() body: ResetPasswordDto): Promise<void> {
    await this.resetPasswordUseCase.execute({
      token: body.token,
      newPassword: body.newPassword,
    });
  }
}
