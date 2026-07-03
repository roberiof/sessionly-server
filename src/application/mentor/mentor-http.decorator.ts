import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

export function ApiMentorsController() {
  return applyDecorators(ApiTags('mentors'));
}

export function ApiMentorsFetchManyDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'List mentors',
      description:
        'Public directory of complete-profile, active mentors. Supports search, filters, and pagination.',
    }),
    ApiOkResponse({ description: 'Paginated list of mentors.' }),
    ApiBadRequestResponse({ description: 'Invalid query parameters.' }),
  );
}

export function ApiMentorsFetchByIdDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get mentor profile',
      description:
        'Public mentor profile with next-7-days availability preview.',
    }),
    ApiOkResponse({ description: 'Mentor profile.' }),
    ApiNotFoundResponse({ description: 'Mentor not found.' }),
  );
}

export function ApiMentorsFetchAvailabilityDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get mentor availability',
      description:
        'Recurring rules and concrete slots within a from–to range (max 31 days).',
    }),
    ApiOkResponse({ description: 'Availability rules and slots.' }),
    ApiBadRequestResponse({ description: 'Invalid date range.' }),
    ApiNotFoundResponse({ description: 'Mentor not found.' }),
  );
}
