import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './application/auth/auth.module';
import { AvailabilityModule } from './application/availability/availability.module';
import { UserModule } from './application/user/user.module';
import { MentorModule } from './application/mentor/mentor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    AvailabilityModule,
    MentorModule,
  ],
})
export class AppModule {}
