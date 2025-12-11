import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EMAIL_JOB_NAMES } from './interfaces/email-job-names';
import {
  OrderConfirmationJobData,
  PasswordResetJobData,
  SendOtpJobData,
} from './interfaces/email-job-data.interface';

@Injectable()
export class EmailQueueService {
  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {}

  async sendOtp(data: SendOtpJobData) {
    return this.emailQueue.add(EMAIL_JOB_NAMES.SEND_OTP, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async sendPasswordReset(data: PasswordResetJobData) {
    return this.emailQueue.add(EMAIL_JOB_NAMES.PASSWORD_RESET, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async sendOrderConfirmation(data: OrderConfirmationJobData) {
    return this.emailQueue.add(EMAIL_JOB_NAMES.ORDER_CONFIRMATION, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
