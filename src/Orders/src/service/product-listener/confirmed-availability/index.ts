import { Handler, SQSEvent } from "aws-lambda";
import { DeSerialize } from "../../../../../commons/helpers/event-helper";
import { OrderEventType } from "../../../shared/models/orders";
import { UpdateOrderStatus } from "../../adapters/orders-ddb-adapter";

type AvilabilityConfirmationEvent = {
	orderId: string;
	productId: string;
	status: string;
}

const lambdaHandler: Handler = async (event: SQSEvent) : Promise<void> => {

	console.log(event);	
	const productAvailabilityEvent = DeSerialize<AvilabilityConfirmationEvent, OrderEventType>(event)!;

	const key = {
		orderId: productAvailabilityEvent.causationid,
		productId: productAvailabilityEvent.data.productId,
	};

	await UpdateOrderStatus(key, productAvailabilityEvent.data.status == 'AVAILABLE' ? 'CONFIRMED' : 'CANCELLED')
};


export const handler = lambdaHandler;

