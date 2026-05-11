import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Strategy } from 'passport-local';
import { LoginDto } from '../dtos/login.dto';
import { ValidateUserCredentialsUseCase } from '../use-cases/validate-user-credentials.use-case';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(
    private readonly validateUserCredentials: ValidateUserCredentialsUseCase,
  ) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string): Promise<{ userId: string }> {
    const dto = plainToInstance(LoginDto, { email, password });
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const first = errors[0]?.constraints
        ? Object.values(errors[0].constraints)[0]
        : 'Invalid login payload.';
      throw new BadRequestException(first);
    }

    const user = await this.validateUserCredentials.execute({
      email: dto.email,
      password: dto.password,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return user;
  }
}
