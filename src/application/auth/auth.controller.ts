import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { RESPONSE } from 'src/core/response/response.messages';
import {
  ApiAuthController,
  ApiAuthLoginDocs,
  ApiAuthRefreshDocs,
} from './auth-http.decorator';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshSessionUseCase } from './use-cases/refresh-session.use-case';
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
}
