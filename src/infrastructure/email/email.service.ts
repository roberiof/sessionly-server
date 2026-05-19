import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

type SendPasswordResetEmailInput = {
  to: string;
  resetToken: string;
};

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromAddress: string;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(config.get<string>('RESEND_API_KEY'));
    this.fromAddress =
      config.get<string>('EMAIL_FROM') ?? 'onboarding@resend.dev';
    this.appUrl = config.get<string>('APP_URL') ?? 'http://localhost:3000';
  }

  async sendPasswordResetEmail(
    input: SendPasswordResetEmailInput,
  ): Promise<void> {
    const resetUrl = `${this.appUrl}/reset-password?token=${input.resetToken}`;

    const { error } = await this.resend.emails.send({
      from: this.fromAddress,
      to: input.to,
      subject: 'Reset your Sessionly password',
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to set a new password. This link expires in 30 minutes.</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, ignore this email.</p>
      `,
    });

    if (error) {
      this.logger.error({ error }, 'Failed to send password reset email');
    }
  }
}
