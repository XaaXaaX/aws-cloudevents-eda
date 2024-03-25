import { Handler, SQSEvent } from "aws-lambda";
import { DeSerialize } from "../../../../commons/helpers/event-helper";
import { ShipmentEntity, ShipmentEventType } from "../../../../Shipment/src/shared/models/shipment";

const lambdaHandler: Handler = async (event: SQSEvent) : Promise<void> => {
	const receivedEvent = DeSerialize<ShipmentEntity, ShipmentEventType>(event)!;
};

export const handler = lambdaHandler;

