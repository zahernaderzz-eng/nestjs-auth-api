import { SendOtpStrategy } from './send-otp.strategy';
import { PasswordResetStrategy } from './password-reset.strategy';
import { OrderConfirmationStrategy } from './order-confirmation.strategy';
import { EMAIL_JOB_NAMES } from '../interfaces/email-job-names';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailStrategyFactory {
  constructor(
    private readonly sendOtp: SendOtpStrategy,
    private readonly passwordReset: PasswordResetStrategy,
    private readonly orderConfirmation: OrderConfirmationStrategy,
  ) {}

  getStrategy(name: string) {
    const strategies = {
      [EMAIL_JOB_NAMES.SEND_OTP]: this.sendOtp,
      [EMAIL_JOB_NAMES.PASSWORD_RESET]: this.passwordReset,
      [EMAIL_JOB_NAMES.ORDER_CONFIRMATION]: this.orderConfirmation,
    };

    return strategies[name] || null;
  }
}
