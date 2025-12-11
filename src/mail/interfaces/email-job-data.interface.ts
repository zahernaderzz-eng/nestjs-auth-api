import { EMAIL_JOB_NAMES } from './email-job-names';

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

export interface OrderData {
  orderId: string;
  total: number;
  items: OrderItemData[];
  createdAt: Date;
}

export interface OrderConfirmationJobData {
  to: string;
  orderData: OrderData;
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

export const MAIL_QUEUE_NAME = 'email';

export interface EmailJobStrategy<TData> {
  execute(data: TData): Promise<void>;
}
