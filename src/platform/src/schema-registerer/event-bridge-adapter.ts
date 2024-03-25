import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const client = new EventBridgeClient({});

export const putEvents = async ( event: Record<string, any> ) => {

  const response = await client.send(
    new PutEventsCommand({
      Entries: [
        {
          EventBusName: process.env.EVENT_BUS_ARN!,
          Detail: JSON.stringify(event),
          Source: event.source,
          DetailType: `${event.type}.${event.dataversion}`
        },
      ],
    }),
  );
}