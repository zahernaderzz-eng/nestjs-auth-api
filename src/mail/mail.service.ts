import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderData } from './interfaces/email-job-data.interface';
import { otpTemplate } from './templates/otp.template';
import { passwordResetTemplate } from './templates/password-reset.template';
import { orderConfirmationTemplate } from './templates/order-confirmation.template';

@Injectable()
export class MailService {
  private readonly defaultFrom: string;
  private readonly logger = new Logger(MailService.name);
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.defaultFrom =
      this.configService.get<string>('MAIL_FROM') || 'noreply@yourapp.com';
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const baseUrl = this.configService.get<string>('APP_URL');
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    return this.send(
      to,
      'Password Reset Request',
      passwordResetTemplate(resetLink),
    );
  }

  async sendOtpViaEmail(to: string, otp: string) {
    return this.send(to, 'OTP Request', otpTemplate(otp));
  }

  async sendOrderConfirmationEmail(to: string, orderData: OrderData) {
    return this.send(
      to,
      `Order Confirmation - #${orderData.orderId}`,
      orderConfirmationTemplate(orderData),
    );
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.mailerService.sendMail({
        from: this.defaultFrom,
        to,
        subject,
        html,
      });

      this.logger.log(
        `Email sent successfully to ${to} with subject "${subject}"`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to} with subject "${subject}": ${
          error instanceof Error ? error.message : error
        }`,
      );
      throw error;
    }
  }
}
