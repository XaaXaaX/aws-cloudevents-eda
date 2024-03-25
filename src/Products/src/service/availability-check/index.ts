import { Handler, SQSEvent } from "aws-lambda";
import { DeSerialize } from "../../../../commons/helpers/event-helper";
import { OrderEntity, OrderEventType } from "../../../../Orders/src/shared/models/orders";
import { SendMessageEvent } from "../../../../commons/adapters/events-sender";
import { InitEvent } from "../../../../commons/models/cloud-event";
import { GetProduct } from "../adapters/products-ddb-adapter";
import { ProductEventType } from "../../shared/models/products";

type ProductAvailableEvent = {
	productId: string;
	status: string;
};

const lambdaHandler: Handler = async (event: SQSEvent) : Promise<void> => {

	const receivedEvent = DeSerialize<OrderEntity, OrderEventType>(event)!;

	const key = {
		productId: receivedEvent.data.productId,
	};

	const product = await GetProduct(key);

	const isProductAvailable = product.stock > receivedEvent.data.quantity;
	const integration = InitEvent<ProductAvailableEvent, ProductEventType>(
		process.env.SOURCE!,
		isProductAvailable ? ProductEventType.ProductAvailabilityConfirmed : ProductEventType.ProductExhausted,
		{
			productId: receivedEvent.data.productId,
			status: isProductAvailable ? "AVAILABLE" : "UNAVAILABLE",
		},
		"v1.0",
		process.env.SCHEMA_URL,
		receivedEvent.causationid,
		receivedEvent.correlationid,
	);
	
	await SendMessageEvent(integration)
};


export const handler = lambdaHandler;

