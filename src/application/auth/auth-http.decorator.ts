import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthTokensSuccessResponseDto } from './dtos/auth.http.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

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

export function ApiAuthLogoutDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Sign out',
      description:
        'Revokes the provided refresh token. Idempotent: succeeds even if the token is unknown or already revoked.',
    }),
    ApiBody({ type: RefreshTokenDto }),
    ApiOkResponse({ description: 'Logged out successfully.' }),
    ApiBadRequestResponse({
      description: 'Invalid request body (validation).',
    }),
  );
}

export function ApiAuthForgotPasswordDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Request password reset',
      description:
        'Sends a reset email if the account exists. Always returns 204 — never leaks whether the email is registered.',
    }),
    ApiBody({ type: ForgotPasswordDto }),
    ApiNoContentResponse({
      description: 'Reset email sent (if account exists).',
    }),
    ApiBadRequestResponse({
      description: 'Invalid request body (validation).',
    }),
  );
}

export function ApiAuthResetPasswordDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reset password',
      description:
        'Validates the emailed token, sets the new password, and revokes all existing refresh tokens.',
    }),
    ApiBody({ type: ResetPasswordDto }),
    ApiNoContentResponse({ description: 'Password reset successfully.' }),
    ApiBadRequestResponse({
      description: 'Invalid request body (validation).',
    }),
    ApiUnauthorizedResponse({ description: 'Invalid or expired reset token.' }),
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
