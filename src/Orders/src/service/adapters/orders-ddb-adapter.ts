import { DynamoDBClient, PutItemCommand, PutItemCommandInput, UpdateItemCommand, UpdateItemCommandInput } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const dynamoDBClient = new DynamoDBClient({});

const PutOrder = async (event: any): Promise<void> => {
    const input: PutItemCommandInput = {
        Item: marshall(event),
        TableName: process.env.TABLE_NAME
    };
    
    await dynamoDBClient.send(new PutItemCommand(input));
}
const UpdateOrderStatus = async (key: Record<string, any>, status: string): Promise<void> => {
    const input: UpdateItemCommandInput = {
        Key: marshall(key),
        UpdateExpression: "set #s = :s",
        ExpressionAttributeNames: {
            "#s": 'orderStatus'
        },
        ExpressionAttributeValues: marshall({
            ":s": status
        }),
        TableName: process.env.TABLE_NAME
    };
    
    await dynamoDBClient.send(new UpdateItemCommand(input));
}



export {
    PutOrder,
    UpdateOrderStatus
}

