import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MailService } from './mail.service';

import {
  EMAIL_JOB_NAMES,
  SendOtpJobData,
  PasswordResetJobData,
  OrderConfirmationJobData,
  EmailJobPayload,
} from './email-job-data.interface';

@Processor('email')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<EmailJobPayload>): Promise<void> {
    this.logger.debug(`Received job name: "${job.name}"`);
    this.logger.debug(`Job data: ${JSON.stringify(job.data)}`);

    try {
      switch (job.name) {
        case EMAIL_JOB_NAMES.SEND_OTP:
          await this.handleSendOtp(job as Job<SendOtpJobData>);
          break;

        case EMAIL_JOB_NAMES.PASSWORD_RESET:
          await this.handlePasswordReset(job as Job<PasswordResetJobData>);
          break;

        case EMAIL_JOB_NAMES.ORDER_CONFIRMATION:
          await this.handleOrderConfirmation(
            job as Job<OrderConfirmationJobData>,
          );
          break;

        default:
          this.logger.warn(
            `Unknown job type: "${job.name}". Expected: ${Object.values(EMAIL_JOB_NAMES).join(', ')}`,
          );
          throw new Error(`Unhandled job type: ${job.name}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to process job "${job.name}": ${errorMessage}`);
      throw error;
    }
  }

  private async handleSendOtp(job: Job<SendOtpJobData>): Promise<void> {
    const { to, otp } = job.data;
    this.logger.log(`Sending OTP to ${to}`);
    await this.mailService.sendOtpViaEmail(to, otp);
  }

  private async handlePasswordReset(
    job: Job<PasswordResetJobData>,
  ): Promise<void> {
    const { to, token } = job.data;
    this.logger.log(`Sending reset email to ${to}`);
    await this.mailService.sendPasswordResetEmail(to, token);
  }

  private async handleOrderConfirmation(
    job: Job<OrderConfirmationJobData>,
  ): Promise<void> {
    const { to, orderData } = job.data;
    this.logger.log(`Sending order confirmation to ${to}`);
    await this.mailService.sendOrderConfirmationEmail(to, orderData);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job "${job.name}" completed for ${job.data.to}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error): void {
    this.logger.error(`Job "${job.name}" failed: ${err.message}`);
  }
}
