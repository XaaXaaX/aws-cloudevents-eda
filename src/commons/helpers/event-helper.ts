import { EventBridgeEvent, SNSEvent, SQSEvent } from "aws-lambda";
import { EventModel } from "../models/cloud-event";

type EventType = SQSEvent | SNSEvent | EventBridgeEvent<string, any> | EventModel<any, any> | any;
const getEvent = <T,U>(
  event: EventType
  ): EventModel<T,U> | Record<string, any> | null => {
  if ( event.specVersion ) 
    return event;

  if( event.Records[0].eventSource == "aws:sqs" )
    return JSON.parse(event.Records[0].body);

  if( event.Records?.[0]?.eventSource == "aws:sns" ) 
    return JSON.parse(event.Records[0].Sns.Message);
  
  if( event["detail-type"] ) 
    return event.detail;

  return null;
}

export const DeSerialize = <T,U>(
  event: EventType
  ):EventModel<T,U> | Record<string, any> | null => {
  const evt = getEvent<T,U>(event);
  console.log({
    ...evt, 
    recipient: process.env.SOURCE,
  });
  return evt;
}