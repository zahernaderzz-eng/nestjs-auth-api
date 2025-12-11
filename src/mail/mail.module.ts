import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { MailService } from './mail.service';
import { MailProcessor } from './queue/mail.processor';
import { MAIL_QUEUE_NAME } from './interfaces/email-job-data.interface';
import { SendOtpStrategy } from './strategies/send-otp.strategy';
import { PasswordResetStrategy } from './strategies/password-reset.strategy';
import { OrderConfirmationStrategy } from './strategies/order-confirmation.strategy';
import { MailStrategyFactory } from './strategies/strategy.factory';
import { EmailQueueService } from './email-queue.service';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('SMTP_HOST'),
          port: config.get<number>('SMTP_PORT'),
          secure: false,
          auth: {
            user: config.get<string>('SMTP_USERNAME'),
            pass: config.get<string>('SMTP_PASSWORD'),
          },
        },
      }),
    }),

    BullModule.registerQueue({
      name: MAIL_QUEUE_NAME,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  providers: [
    MailService,
    MailProcessor,
    SendOtpStrategy,
    PasswordResetStrategy,
    OrderConfirmationStrategy,
    MailStrategyFactory,
    EmailQueueService,
  ],
  exports: [MailService, EmailQueueService],
})
export class MailModule {}
