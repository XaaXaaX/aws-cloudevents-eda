import { DynamoDBStreamEvent, Handler } from "aws-lambda";
import { PublishEvents } from "../../../../../commons/adapters/events-publisher";
import { EventModel, InitEvent } from "../../../../../commons/models/cloud-event";
import { OrderEntity, OrderEventType } from "../../../shared/models/orders";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { nanoid } from "nanoid";

type Order = {
	orderId: string;
	price: number;
	quantity: number;
	orderDate: string;
	productId: string;
	orderStatus: string;
	userId: string;
}

export type DynamoDbInternalRecord = { [key: string]: AttributeValue }

const lambdaHandler: Handler = async (event: DynamoDBStreamEvent) : Promise<void> => {

	const dynamodbNewImage = event.Records[0].dynamodb?.NewImage;

	if (!dynamodbNewImage) {
		console.error('No order found');
		return;
	}

	const receivedEvent = unmarshall(dynamodbNewImage as DynamoDbInternalRecord) as Order;
	
	let eventType = 
		receivedEvent.orderStatus == 'PLACED' ? OrderEventType.OrderPlaced : 
		receivedEvent.orderStatus == 'CONFIRMED' ? OrderEventType.OrderConfirmed :
		receivedEvent.orderStatus == 'CANCELLED' ? OrderEventType.OrderCancelled :
		receivedEvent.orderStatus == 'SHIPPED' ? OrderEventType.OrderUpdated :
		null;

	if (!eventType) {
		console.error('Invalid Order Status', receivedEvent);
		return;
	}

	const correlationId = nanoid();
	
	await PublishEvents([
		CreateCloudEvent(eventType, receivedEvent, "v1.0", correlationId),
		CreateCloudEvent(eventType, receivedEvent, "v2.0", correlationId)
	]);
};


export const handler = lambdaHandler;

function CreateCloudEvent(
	eventType: OrderEventType,
	receivedEvent: Order,
	dataversion = "v1.0",
	correlationId: string | undefined = undefined
	): EventModel<OrderEntity, OrderEventType> {
	const event =  InitEvent<OrderEntity, OrderEventType>(
		process.env.SOURCE!,
		eventType,
		{
			orderId: receivedEvent.orderId,
			price: receivedEvent.price,
			quantity: receivedEvent.quantity,
			orderDate: receivedEvent.orderDate,
			productId: receivedEvent.productId,
			userId: receivedEvent.userId
		},
		dataversion,
		process.env.SCHEMA_URL,
		receivedEvent.orderId,
		correlationId
	);

	return event;
}

