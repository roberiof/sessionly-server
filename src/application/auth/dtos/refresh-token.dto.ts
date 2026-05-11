import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description:
      'Opaque refresh token returned from login or the previous refresh call.',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
