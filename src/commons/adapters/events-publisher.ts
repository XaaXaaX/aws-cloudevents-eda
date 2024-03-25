import { PublishBatchCommand, PublishBatchCommandInput, PublishCommand, PublishCommandInput, SNSClient } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({});

const PublishEvent = async (event: any): Promise<void> => {
    const input: PublishCommandInput = {
        Message: JSON.stringify(event),
        TopicArn: process.env.TOPIC_ARN
    };
    
    await snsClient.send(new PublishCommand(input));
}

const PublishEvents = async (event: any[]): Promise<void> => {
    const input: PublishBatchCommandInput = {
        PublishBatchRequestEntries: event.map(e => ({
            Id: e.id,
            Message: JSON.stringify(e)
        })),
        TopicArn: process.env.TOPIC_ARN
    };
    
    await snsClient.send(new PublishBatchCommand(input));
}



export {
    PublishEvent,
    PublishEvents
}


