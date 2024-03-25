import { Handler, SQSEvent } from "aws-lambda";
import { nanoid } from "nanoid";
import { DeSerialize } from "../../../../../commons/helpers/event-helper";
import { OrderEventType } from "../../../shared/models/orders";
import { PutOrder } from "../../adapters/orders-ddb-adapter";

type OrderPlaceCommand = {
	userId: string;
	price: number;
	quantity: number;
	orderDate: string;
	productId: string;
}

const lambdaHandler: Handler = async (event: SQSEvent) : Promise<void> => {

	const command = DeSerialize<OrderPlaceCommand, OrderEventType>(event)!;
	const orderId = nanoid();

	const item = {
		orderId,
		price: command.data.price,
		quantity: command.data.quantity,
		orderDate: command.data.orderDate,
		productId: command.data.productId,
		userId: command.data.userId,
		orderStatus: "PLACED"
	};

	await PutOrder(item)
};


export const handler = lambdaHandler;

