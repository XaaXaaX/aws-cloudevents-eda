import { DynamoDBClient, PutItemCommand, PutItemCommandInput, UpdateItemCommand, UpdateItemCommandInput } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const dynamoDBClient = new DynamoDBClient({});

const PutItem = async (event: any): Promise<void> => {
    const input: PutItemCommandInput = {
        Item: marshall(event),
        TableName: process.env.TABLE_NAME
    };
    
    await dynamoDBClient.send(new PutItemCommand(input));
}

export {
    PutItem
}

