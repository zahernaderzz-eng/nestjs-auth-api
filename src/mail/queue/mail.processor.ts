import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

import { EmailJobPayload } from '../interfaces/email-job-data.interface';

import { MailStrategyFactory } from '../strategies/strategy.factory';

@Processor('email')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly strategyFactory: MailStrategyFactory) {
    super();
  }

  async process(job: Job<EmailJobPayload>): Promise<void> {
    this.logger.log(`Processing job [${job.name}] for ${job.data.to}`);

    const strategy = this.strategyFactory.getStrategy(job.name);

    if (!strategy) {
      this.logger.error(`No strategy found for job type: ${job.name}`);
      throw new Error(`Strategy not found for job type ${job.name}`);
    }

    await strategy.execute(job.data);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job "${job.name}" completed for ${job.data.to}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error): void {
    this.logger.error(
      `Job [${job.name}] failed for ${job.data.to}: ${err.message}`,
    );
  }
}
