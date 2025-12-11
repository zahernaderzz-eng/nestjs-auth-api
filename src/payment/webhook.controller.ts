import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

@Controller()
@UseInterceptors() // Disable all interceptors for this controller
export class RawWebhookController {
  constructor(
    private paymentService: PaymentService,
    private config: ConfigService,
  ) {}

  @Post('/payment/webhook')
  @HttpCode(HttpStatus.OK)
  async handleRawWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      const secret = this.config.get('STRIPE_WEBHOOK_SECRET');

      // Get raw body from request
      const payload = req.rawBody || (req as any).body;

      if (!payload) {
        throw new Error('Missing raw body');
      }

      if (!signature) {
        throw new Error('Missing stripe-signature header');
      }

      const event = this.paymentService['stripe'].webhooks.constructEvent(
        payload,
        signature,
        secret,
      );

      await this.paymentService.handleWebhook(event);

      return { received: true };
    } catch (err) {
      console.error('Webhook Error:', err.message);
      throw new Error(`Webhook Error: ${err.message}`);
    }
  }
}
