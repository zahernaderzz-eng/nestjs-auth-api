export const EMAIL_JOB_NAMES = {
  SEND_OTP: 'send-otp',
  PASSWORD_RESET: 'password-reset',
  ORDER_CONFIRMATION: 'order-confirmation',
} as const;

export interface SendOtpJobData {
  to: string;
  otp: string;
}

export interface PasswordResetJobData {
  to: string;
  token: string;
}

export interface OrderItemData {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderConfirmationJobData {
  to: string;
  orderData: {
    orderId: string;
    total: number;
    items: OrderItemData[];
    createdAt: Date;
  };
}

export type EmailJobPayload =
  | SendOtpJobData
  | PasswordResetJobData
  | OrderConfirmationJobData;

export interface EmailJobDataMap {
  [EMAIL_JOB_NAMES.SEND_OTP]: SendOtpJobData;
  [EMAIL_JOB_NAMES.PASSWORD_RESET]: PasswordResetJobData;
  [EMAIL_JOB_NAMES.ORDER_CONFIRMATION]: OrderConfirmationJobData;
}
