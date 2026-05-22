import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function ApiAvailabilityController() {
  return applyDecorators(ApiTags('availability'), ApiBearerAuth('JWT'));
}

export function ApiAvailabilityFetchMeDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Fetch mentor availability',
      description:
        'Returns recurring rules and ad-hoc slots for the signed-in mentor within the given date range. Range capped at 31 days.',
    }),
    ApiOkResponse({
      description: 'Availability fetched successfully.',
    }),
    ApiBadRequestResponse({
      description: 'Invalid query parameters or date range exceeds 31 days.',
    }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token.',
    }),
    ApiForbiddenResponse({
      description: 'User is not a mentor.',
    }),
  );
}

export function ApiAvailabilityUpdateRulesMeDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Replace recurring availability rules',
      description:
        'Replaces the full weekly recurring rules for the signed-in mentor. Days must be unique; time ranges within a day must not overlap.',
    }),
    ApiOkResponse({
      description: 'Availability rules updated successfully.',
    }),
    ApiBadRequestResponse({
      description:
        'Invalid body — duplicate weekday, overlapping ranges, or malformed HH:mm times.',
    }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token.',
    }),
    ApiForbiddenResponse({
      description: 'User is not a mentor.',
    }),
  );
}

export function ApiAvailabilityCreateSlotMeDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create ad-hoc availability slot',
      description:
        'Creates a one-off ADD or BLOCK slot for the signed-in mentor. BLOCK requires a ruleId referencing an existing rules set.',
    }),
    ApiOkResponse({
      description: 'Availability slot created successfully.',
    }),
    ApiBadRequestResponse({
      description:
        'Invalid body — startTime not before endTime, startTime in the past, or missing ruleId on BLOCK.',
    }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token.',
    }),
    ApiForbiddenResponse({
      description: 'User is not a mentor.',
    }),
    ApiNotFoundResponse({
      description: 'Referenced availability rule not found.',
    }),
  );
}

export function ApiAvailabilityDeleteSlotMeDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete ad-hoc availability slot',
      description:
        'Deletes a slot owned by the signed-in mentor. Rejected if a booking request references it.',
    }),
    ApiOkResponse({
      description: 'Availability slot deleted successfully.',
    }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token.',
    }),
    ApiForbiddenResponse({
      description: 'User is not a mentor or does not own this slot.',
    }),
    ApiNotFoundResponse({
      description: 'Availability slot not found.',
    }),
  );
}
