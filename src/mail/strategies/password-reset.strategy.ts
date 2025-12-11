import { Injectable, Logger } from '@nestjs/common';
import {
  EmailJobStrategy,
  PasswordResetJobData,
} from '../interfaces/email-job-data.interface';
import { MailService } from '../mail.service';

@Injectable()
export class PasswordResetStrategy
  implements EmailJobStrategy<PasswordResetJobData>
{
  private readonly logger = new Logger(PasswordResetStrategy.name);

  constructor(private readonly mailService: MailService) {}

  async execute(data: PasswordResetJobData): Promise<void> {
    try {
      this.logger.log(`Sending password reset email to ${data.to}`);

      await this.mailService.sendPasswordResetEmail(data.to, data.token);

      this.logger.log(`Password reset email successfully sent to ${data.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${data.to}: ${
          error instanceof Error ? error.message : error
        }`,
      );

      throw error;
    }
  }
}
