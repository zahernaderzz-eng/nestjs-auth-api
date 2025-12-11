export const EMAIL_JOB_NAMES = {
  SEND_OTP: 'send-otp',
  PASSWORD_RESET: 'password-reset',
  ORDER_CONFIRMATION: 'order-confirmation',
} as const;

export type EmailJobName = keyof typeof EMAIL_JOB_NAMES;
