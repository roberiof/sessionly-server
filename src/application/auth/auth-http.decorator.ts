import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthTokensSuccessResponseDto } from './dtos/auth.http.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';

export function ApiAuthController() {
  return applyDecorators(ApiTags('auth'));
}

export function ApiAuthLoginDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Sign in',
      description:
        'Validates email and password and returns a new access + refresh token pair.',
    }),
    ApiBody({ type: LoginDto }),
    ApiOkResponse({ type: AuthTokensSuccessResponseDto }),
    ApiBadRequestResponse({
      description:
        'Invalid request body (validation) or malformed credentials.',
    }),
    ApiUnauthorizedResponse({
      description: 'Invalid email or password.',
    }),
  );
}

export function ApiAuthRefreshDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Refresh session',
      description:
        'Exchanges a valid refresh token for a new access + refresh pair (rotation).',
    }),
    ApiBody({ type: RefreshTokenDto }),
    ApiOkResponse({ type: AuthTokensSuccessResponseDto }),
    ApiBadRequestResponse({
      description: 'Invalid request body (validation).',
    }),
    ApiUnauthorizedResponse({
      description: 'Invalid or expired refresh token.',
    }),
  );
}
