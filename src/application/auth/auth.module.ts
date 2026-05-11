import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { SignOptions } from 'jsonwebtoken';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshSessionUseCase } from './use-cases/refresh-session.use-case';
import { SignTokensUseCase } from './use-cases/sign-tokens.use-case';
import { ValidateUserCredentialsUseCase } from './use-cases/validate-user-credentials.use-case';

@Module({
  imports: [
    InfrastructureModule,
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET must be set.');
        }

        const expiresIn = (configService.get<string>('JWT_EXPIRES_IN') ??
          '15m') as SignOptions['expiresIn'];

        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    ValidateUserCredentialsUseCase,
    SignTokensUseCase,
    RefreshSessionUseCase,
    LocalStrategy,
    JwtStrategy,
  ],
})
export class AuthModule {}
