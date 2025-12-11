import { Injectable, Logger } from '@nestjs/common';
import {
  EmailJobStrategy,
  SendOtpJobData,
} from '../interfaces/email-job-data.interface';
import { MailService } from '../mail.service';

@Injectable()
export class SendOtpStrategy implements EmailJobStrategy<SendOtpJobData> {
  private readonly logger = new Logger(SendOtpStrategy.name);

  constructor(private readonly mailService: MailService) {}

  async execute(data: SendOtpJobData): Promise<void> {
    try {
      this.logger.log(`Sending OTP to ${data.to}`);

      await this.mailService.sendOtpViaEmail(data.to, data.otp);

      this.logger.log(`OTP successfully sent to ${data.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send OTP to ${data.to}: ${error instanceof Error ? error.message : error}`,
      );

      throw error;
    }
  }
}
