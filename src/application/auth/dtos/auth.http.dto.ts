import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDataDto {
  @ApiProperty({
    description:
      'Access JWT (Authorization: Bearer). Payload: only the sub claim (user id).',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Opaque refresh token; store and transmit securely.',
  })
  refreshToken: string;
}

export class AuthTokensSuccessResponseDto {
  @ApiProperty({ example: 'Signed in successfully.' })
  message: string;

  @ApiProperty({ type: AuthTokensDataDto })
  data: AuthTokensDataDto;
}
