import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CreateUserResponseDto,
  FetchUsersResponseDto,
} from './dtos/user.http.dto';

export function ApiUsersController() {
  return applyDecorators(ApiTags('users'));
}

export function ApiUsersListDocs() {
  return applyDecorators(
    ApiBearerAuth('JWT'),
    ApiOperation({
      summary: 'List users',
      description:
        'Paginated list of users. Requires a valid JWT access token.',
    }),
    ApiOkResponse({ type: FetchUsersResponseDto }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token.',
    }),
  );
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

export function ApiUsersDeleteDocs() {
  return applyDecorators(
    ApiBearerAuth('JWT'),
    ApiParam({ name: 'id', format: 'uuid', description: 'User id.' }),
    ApiOperation({
      summary: 'Delete user',
      description:
        'Soft-deletes a user by ID (sets deletedAt). Requires a valid JWT access token.',
    }),
    ApiOkResponse({
      description: 'User deleted successfully.',
    }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token.',
    }),
    ApiNotFoundResponse({
      description: 'User not found.',
    }),
    ApiBadRequestResponse({
      description: 'User already deleted.',
    }),
  );
}

export function ApiUsersUpdateDocs() {
  return applyDecorators(
    ApiBearerAuth('JWT'),
    ApiParam({ name: 'id', format: 'uuid', description: 'User id.' }),
    ApiOperation({
      summary: 'Update user',
      description: 'Updates a user by ID. Requires a valid JWT access token.',
    }),
    ApiOkResponse({
      description: 'User updated successfully.',
    }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token.',
    }),
    ApiNotFoundResponse({
      description: 'User not found.',
    }),
  );
}
