import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Injectable()
@Processor('notification')
export class NotificationProcessor extends WorkerHost {
  //[1,2,3,4]
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  async process(job: Job<any>) {
    try {
      this.logger.log(`Processing job: ${job.name} (ID: ${job.id})`);

      switch (job.name) {
        case 'send-to-user':
          this.logger.log(`Sending notification to user ${job.data.userId}`);
          await this.notificationService.sendToUserInternal(
            job.data.userId,
            job.data.title,
            job.data.body,
            job.data.type,
            job.data.data,
          );
          break;

        case 'send-to-multiple':
          this.logger.log(
            `Sending notification to ${job.data.userIds.length} users`,
          );
          await this.notificationService.sendToMultipleUsersInternal(
            job.data.userIds,
            job.data.title,
            job.data.body,
            job.data.type,
            job.data.data,
          );
          break;
        //enum
        case 'send-broadcast':
          this.logger.log(`Broadcasting notification to all users`);
          await this.notificationService.sendBroadcastInternal(
            job.data.title,
            job.data.body,
            job.data.type,
            job.data.data,
          );
          break;

        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process job ${job.name} (ID: ${job.id}): ${error.message}`,
      );
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job "${job.name}" (ID: ${job.id}) completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(
      `Job "${job.name}" (ID: ${job.id}) failed after ${job.attemptsMade} attempts: ${err.message}`,
    );
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(
      `🔄 Job "${job.name}" (ID: ${job.id}) is now active (attempt ${job.attemptsMade + 1})`,
    );
  }
}
