import { Handler, SQSEvent } from "aws-lambda";
import { DeSerialize } from "../../../../commons/helpers/event-helper";
import { OrderEntity, OrderEventType } from "../../../../Orders/src/shared/models/orders";
import { InitEvent } from "../../../../commons/models/cloud-event";
import { ShipmentEntity, ShipmentEventType } from "../../shared/models/shipment";
import { nanoid } from "nanoid";
import { putEvents } from "../adapters/event-bridge-adapter";

const lambdaHandler: Handler = async (event: SQSEvent) : Promise<void> => {
	const receivedEvent = DeSerialize<OrderEntity, OrderEventType>(event)!;

	if(receivedEvent.type == OrderEventType.OrderConfirmed) {
		const integration = InitEvent<ShipmentEntity, ShipmentEventType>(
			process.env.SOURCE!,
			ShipmentEventType.Shipped,
			{
				shipmentId: nanoid(),
				orderId: receivedEvent.data.orderId,
				userId: receivedEvent.data.userId,
				date: new Date().toISOString(),
				iterations: [
					'London',
					'Paris',
					'Berlin', 
					'Moscow',
				],
				status: "Shipped",
			},
			"v1.0",
			process.env.SCHEMA_URL,
			receivedEvent.causationid,
			receivedEvent.correlationid
		);

		await putEvents(integration);
	}
};

export const handler = lambdaHandler;

