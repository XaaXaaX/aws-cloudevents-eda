import { Duration, Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join, resolve } from 'path';
import { LambdaConfiguration } from '../../../cdk-commons/helpers/nodejs-bundling';
import { StartingPosition, FilterRule, FilterCriteria, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { AttributeType, BillingMode, ITable, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { DynamoEventSource, SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { SQSApiGatewayIntegration } from './sqs-direct-integration';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { EndpointType, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
 
export class OrdersStack extends Stack {
  readonly OrdersTable: ITable;
  private readonly methodResponse = { methodResponses: [{ statusCode: "200" }] };

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
   
    const telemetryExtensionArnParam =  StringParameter.fromStringParameterName(this, 'TelemetryExtensionArnParam', '/telemetry/kinesis/extension/arn').stringValue;
    const telemetryExtensionPolicyArnParam =  StringParameter.fromStringParameterName(this, 'TelemetryExtensionPolicyArnParam', '/telemetry/kinesis/runtime/policy/arn').stringValue;
    const telemetryManagedPolicy = ManagedPolicy.fromManagedPolicyArn(this, 'TelemetryManagedPolicy', telemetryExtensionPolicyArnParam);
    const telemetryExtensionLayerVersion = LayerVersion.fromLayerVersionArn(this, 'TelemetryExtensionLayerVersion', telemetryExtensionArnParam)
    const lambdaServiceRole = new ServicePrincipal('lambda.amazonaws.com');

    const topic = new Topic(this, 'OrdersTopic', {});

    const orderQueue = new Queue(this, 'OrdersQueue', {
      visibilityTimeout: Duration.seconds(30),
      retentionPeriod: Duration.days(14),
      deadLetterQueue: {
        queue: new Queue(this, 'OrdersDLQ', {}),
        maxReceiveCount: 3,
      },
    });

    this.OrdersTable = new Table(this, 'OrdersTable', {
      partitionKey: { name: 'orderId',  type: AttributeType.STRING },
      sortKey: { name: 'productId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      contributorInsightsEnabled: true,
      removalPolicy: RemovalPolicy.DESTROY,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
    });

    const integrationRole = new Role(this, 'integration-role', { assumedBy: new ServicePrincipal('apigateway.amazonaws.com') });
    const api = new RestApi(
        this,
        RestApi.name, 
        {
            restApiName: `${this.stackName}-rest-api`,
            endpointTypes: [EndpointType.REGIONAL],
            cloudWatchRole: true,
            deployOptions: {
                stageName: 'live'
            },
        });

    const sqsIntegration = new SQSApiGatewayIntegration(
        this,
        SQSApiGatewayIntegration.name,
        {
          queue: orderQueue,
          integrationRole: integrationRole,
        }
    );

    const sqsApiResource = api.root.addResource('sqs');
        sqsApiResource.addMethod(
            'POST', 
            sqsIntegration.integration,
            this.methodResponse
        );

    const orderPlacedFunctionRole = new Role(this, 'OrderPlacedFunctionRole', { assumedBy: lambdaServiceRole });
    orderPlacedFunctionRole.addManagedPolicy(telemetryManagedPolicy);
    
    const orderPlacedFunction = new NodejsFunction(this, 'OrderPlacedFunction', {
      entry: resolve(join(__dirname, '../../src/service/ingestion/order-receiver/index.ts')),
      handler: 'handler',
      ...LambdaConfiguration,
      role: orderPlacedFunctionRole,
      layers: [
        telemetryExtensionLayerVersion
      ],
      environment: {
        SOURCE: 'ecommerce.orders.service',
        TABLE_NAME: this.OrdersTable.tableName,
      }
    });

    new LogGroup(this, 'OrderPlacedFunctionLogGroup', {
      logGroupName: `/aws/lambda/${orderPlacedFunction.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY
    });

    orderPlacedFunction.addEventSource(new SqsEventSource(orderQueue, { batchSize: 1 }));

    this.OrdersTable.grantWriteData(orderPlacedFunction);
    orderQueue.grantConsumeMessages(orderPlacedFunction);

    const orderPlacedStreamFunctionRole = new Role(this, 'OrderPlacedStreamFunctionRole',  { assumedBy: lambdaServiceRole });
    orderPlacedStreamFunctionRole.addManagedPolicy(telemetryManagedPolicy);
    
    const orderPlacedStreamFunction = new NodejsFunction(this, 'OrderPlacedStreamFunction', {
      entry: resolve(join(__dirname, '../../src/service/ingestion/order-placed-stream/index.ts')),
      handler: 'handler',
      ...LambdaConfiguration,
      role: orderPlacedStreamFunctionRole,
      environment: {
        SOURCE: 'ecommerce.orders.service',
        TOPIC_ARN: topic.topicArn,
        SCHEMA_URL: 'https://schema.registry.com/v1.0/orders/'
      }
    });
    
    new LogGroup(this, 'OrderPlacedStreamFunctionLogGroup', {
      logGroupName: `/aws/lambda/${orderPlacedStreamFunction.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY
    });

    orderPlacedStreamFunction.addEventSource(new DynamoEventSource(this.OrdersTable, {
      startingPosition: StartingPosition.LATEST,
      retryAttempts: 1,
      filters: [
        FilterCriteria.filter({ eventName: FilterRule.isEqual('MODIFY') }),
        FilterCriteria.filter({ eventName: FilterRule.isEqual('INSERT') })
      ],
    }));

    topic.grantPublish(orderPlacedStreamFunction);
    this.OrdersTable.grantStreamRead(orderPlacedStreamFunction);

    new StringParameter(this, 'OrdersTopicArnParam', {
      parameterName: '/orders/ingestion/topic/arn',
      stringValue: topic.topicArn
    });
  }

}
