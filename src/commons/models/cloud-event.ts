import { nanoid } from 'nanoid';
import { ulid } from 'ulid';
import { v5 as uuidV5 } from 'uuid';

type Nullable<T> = T | null | undefined;

export type SpecVesrion = "1.0.2";
export interface EventModel<TPayload, EventType = string> {
    specversion: SpecVesrion;
    time: string;
    id: string;
    type: EventType;
    source: string;
    idempotencykey: string;
    correlationid?: string;
    causationid?: string;
    data: TPayload;
    dataversion: string;
    dataschema: Nullable<string>;
    sequence: string;
}

export const InitEvent = <TData, TEventType>(
    source: string,
    eventType: TEventType,
    eventData: TData,
    dataVersion: string,
    dataSchema?: string,
    causationId?: string,
    correlationid?: string
     ): EventModel<TData, TEventType> => {
        
    return {
        idempotencykey: uuidV5(JSON.stringify(eventData), "40781d63-9741-40a6-aa25-c5a35d47abd6"),
        id: nanoid(),
        time: new Date().toISOString(),
        data: eventData,
        type: eventType,
        source,
        dataversion: dataVersion,
        dataschema: dataSchema,
        causationid: causationId,
        correlationid: correlationid ?? nanoid(),
        specversion: "1.0.2",
        sequence: ulid(),
    }
  }