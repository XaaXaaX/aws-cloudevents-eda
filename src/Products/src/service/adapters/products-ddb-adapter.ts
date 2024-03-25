import { DynamoDBClient, GetItemCommand, PutItemCommand, PutItemCommandInput, UpdateItemCommand, UpdateItemCommandInput } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const dynamoDBClient = new DynamoDBClient({});

const PutProduct = async (event: any): Promise<void> => {
    const input: PutItemCommandInput = {
        Item: marshall(event),
        TableName: process.env.TABLE_NAME
    };
    
    await dynamoDBClient.send(new PutItemCommand(input));
}
const UpdateOrderStatus = async (key: Record<string, any>, status: string): Promise<void> => {
    const input: UpdateItemCommandInput = {
        Key: marshall(key),
        UpdateExpression: "set status = :status",
        ExpressionAttributeNames: {
            ":status": status
        },
        TableName: process.env.TABLE_NAME
    };
    
    await dynamoDBClient.send(new UpdateItemCommand(input));
}

const GetProduct = async (key: Record<string, any>): Promise<any> => {
    const item = await dynamoDBClient.send(new GetItemCommand({
        Key: marshall(key),
        TableName: process.env.TABLE_NAME
    }));

    return unmarshall(item.Item ?? {});
}


export {
    GetProduct,
    PutProduct,
    UpdateOrderStatus
}

