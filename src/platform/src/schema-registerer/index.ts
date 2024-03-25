import { KinesisStreamEvent } from 'aws-lambda';
import { putEvents } from './event-bridge-adapter';

export const handler = async (event: KinesisStreamEvent): Promise<void> => {

  await Promise.all(event.Records.map(async (record) => {
    const eventData = JSON.parse(Buffer.from(record.kinesis.data, 'base64').toString('ascii'));
    await putEvents(eventData);
  }));  
}