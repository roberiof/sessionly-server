import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnsupportedMediaTypeResponse,
} from '@nestjs/swagger';
import {
  CreateUserResponseDto,
  FetchUserMeResponseDto,
} from './dtos/user.http.dto';

export function ApiUsersController() {
  return applyDecorators(ApiTags('users'));
}

export function ApiUsersCreateDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create user',
      description:
        'Creates an account with a unique email and password (hashed).',
    }),
    ApiOkResponse({ type: CreateUserResponseDto }),
    ApiBadRequestResponse({
      description:
        'Invalid request body (validation / non-whitelisted fields).',
    }),
    ApiConflictResponse({
      description: 'A user with this email already exists.',
    }),
  );
}

export function ApiUsersFetchMeDocs() {
  return applyDecorators(
    ApiBearerAuth('JWT'),
    ApiOperation({
      summary: 'Get current user',
      description:
        'Returns the signed-in user with role-specific profile and computed profileComplete flag.',
    }),
    ApiOkResponse({ type: FetchUserMeResponseDto }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token.',
    }),
  );
}

export function ApiUsersUpdateMeDocs() {
  return applyDecorators(
    ApiBearerAuth('JWT'),
    ApiOperation({
      summary: 'Update current user',
      description:
        'Updates name, bio, avatarUrl, links, activityStatus, and role-specific profile fields.',
    }),
    ApiOkResponse({ type: FetchUserMeResponseDto }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token.',
    }),
    ApiBadRequestResponse({
      description:
        'Invalid request body (validation / non-whitelisted fields).',
    }),
  );
}

export function ApiUsersUpdatePasswordDocs() {
  return applyDecorators(
    ApiBearerAuth('JWT'),
    ApiOperation({
      summary: 'Update password',
      description:
        'Changes password. Revokes all refresh tokens except the current session.',
    }),
    ApiOkResponse({ description: 'Password updated successfully.' }),
    ApiUnauthorizedResponse({
      description:
        'Missing or invalid access token, or wrong current password.',
    }),
    ApiBadRequestResponse({
      description: 'Invalid request body.',
    }),
  );
}

export function ApiUsersDeleteMeDocs() {
  return applyDecorators(
    ApiBearerAuth('JWT'),
    ApiOperation({
      summary: 'Delete current user',
      description:
        'Schedules soft-delete with a 7-day window. Returns deletionScheduledAt. Cancellable via POST /users/me/restore.',
    }),
    ApiOkResponse({
      description: 'Deletion scheduled. Returns { deletionScheduledAt }.',
    }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token.',
    }),
    ApiBadRequestResponse({ description: 'Deletion already pending.' }),
  );
}

export function ApiUsersRestoreMeDocs() {
  return applyDecorators(
    ApiBearerAuth('JWT'),
    ApiOperation({
      summary: 'Restore current user',
      description: 'Cancels a pending soft-delete within the 7-day window.',
    }),
    ApiOkResponse({ description: 'Account restored successfully.' }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token.',
    }),
    ApiNotFoundResponse({ description: 'No pending deletion found.' }),
  );
}

export function ApiUsersUploadAvatarDocs() {
  return applyDecorators(
    ApiBearerAuth('JWT'),
    ApiOperation({
      summary: 'Upload avatar',
      description:
        'Validates mime type and size, strips EXIF, stores in S3, returns { url }. Max 5 MB. Allowed: image/jpeg, image/png, image/webp.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['file'],
        properties: { file: { type: 'string', format: 'binary' } },
      },
    }),
    ApiOkResponse({
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          data: { type: 'object', properties: { url: { type: 'string' } } },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token.',
    }),
    ApiUnsupportedMediaTypeResponse({
      description: 'File type not allowed. Use JPEG, PNG, or WebP.',
    }),
  );
}
