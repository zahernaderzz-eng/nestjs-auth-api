import { Injectable, Logger } from '@nestjs/common';
import {
  EmailJobStrategy,
  OrderConfirmationJobData,
} from '../interfaces/email-job-data.interface';
import { MailService } from '../mail.service';

@Injectable()
export class OrderConfirmationStrategy
  implements EmailJobStrategy<OrderConfirmationJobData>
{
  private readonly logger = new Logger(OrderConfirmationStrategy.name);

  constructor(private readonly mailService: MailService) {}

  async execute(data: OrderConfirmationJobData): Promise<void> {
    try {
      this.logger.log(`Sending order confirmation to ${data.to}`);

      await this.mailService.sendOrderConfirmationEmail(
        data.to,
        data.orderData,
      );

      this.logger.log(
        `Order confirmation email successfully sent to ${data.to}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send order confirmation to ${data.to}: ${
          error instanceof Error ? error.message : error
        }`,
      );

      throw error;
    }
  }
}
