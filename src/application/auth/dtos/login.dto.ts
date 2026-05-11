import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ format: 'email', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ format: 'password', minLength: 1, example: 'secret' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
