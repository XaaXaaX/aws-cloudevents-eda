import { Duration, Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join, resolve } from 'path';
import { LambdaConfiguration } from '../../../cdk-commons/helpers/nodejs-bundling';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { AttributeType, BillingMode, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { FilterOrPolicy, SubscriptionFilter, Topic } from 'aws-cdk-lib/aws-sns';
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export class ProductsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
   
    const telemetryExtensionArnParam =  StringParameter.fromStringParameterName(this, 'TelemetryExtensionArnParam', '/telemetry/kinesis/extension/arn').stringValue;
    const telemetryExtensionPolicyArnParam =  StringParameter.fromStringParameterName(this, 'TelemetryExtensionPolicyArnParam', '/telemetry/kinesis/runtime/policy/arn').stringValue;
    const telemetryManagedPolicy = ManagedPolicy.fromManagedPolicyArn(this, 'TelemetryManagedPolicy', telemetryExtensionPolicyArnParam);
    const telemetryExtensionLayerVersion = LayerVersion.fromLayerVersionArn(this, 'TelemetryExtensionLayerVersion', telemetryExtensionArnParam)
    const lambdaServiceRole = new ServicePrincipal('lambda.amazonaws.com');

    const ordersProductListenerQueueArnParam = StringParameter.fromStringParameterName(this, 'OrdersProductListenerQueueParam', '/orders/product-listener/queue/arn').stringValue;
    const ordersProductListenerQueue = Queue.fromQueueArn(this, 'OrdersProductListenerQueue', ordersProductListenerQueueArnParam);

    const OrdersTopicArnParam = StringParameter.fromStringParameterName(this, 'OrdersTopicArnParam', '/orders/ingestion/topic/arn').stringValue;
    const ordersTopic = Topic.fromTopicArn(this, 'OrdersTopic', OrdersTopicArnParam);

    const productsQueue = new Queue(this, 'ProductsQueue', {
      visibilityTimeout: Duration.seconds(30),
      retentionPeriod: Duration.days(14),
      deadLetterQueue: {
        queue: new Queue(this, 'ProductsDLQ', {}),
        maxReceiveCount: 3,
      },
    });

    ordersTopic.addSubscription(new SqsSubscription(productsQueue, {
      rawMessageDelivery: true,
      filterPolicyWithMessageBody: {
        source: FilterOrPolicy.filter(SubscriptionFilter.stringFilter({
          allowlist: [
            'ecommerce.orders.service'
          ],
        })),
        type: FilterOrPolicy.filter(SubscriptionFilter.stringFilter({
          allowlist: [
            'order.placed'
          ],
        })),
        dataversion: FilterOrPolicy.filter(SubscriptionFilter.stringFilter({
          allowlist: [
            'v1.0'
          ],
        })),
      }
    }))

    const productsTable = new Table(this, 'ProductsTable', {
      partitionKey: { name: 'productId',  type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      contributorInsightsEnabled: true,
      removalPolicy: RemovalPolicy.DESTROY,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
    });

    const productAvailabilityCheckFunctionRole = new Role(this, 'ProductAvailabilityCheckFunctionRole', { assumedBy: lambdaServiceRole });
    productAvailabilityCheckFunctionRole.addManagedPolicy(telemetryManagedPolicy);

    const productAvailabilityCheckFunction = new NodejsFunction(this, 'ProductAvailabilityCheckFunction', {
      entry: resolve(join(__dirname, '../../src/service/availability-check/index.ts')),
      handler: 'handler',
      ...LambdaConfiguration,
      role: productAvailabilityCheckFunctionRole,
      layers: [telemetryExtensionLayerVersion],
      environment: {
        SOURCE: 'ecommerce.products.service',
        TABLE_NAME: productsTable.tableName,
        QUEUE_URL: ordersProductListenerQueue.queueUrl,
        SCHEMA_URL: 'https://schema.registry.com/v1.0/products/'
      }
    });
    
    new LogGroup(this, 'ProductAvailabilityCheckFunctionLogGroup', {
      logGroupName: `/aws/lambda/${productAvailabilityCheckFunction.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY,
    });

    productAvailabilityCheckFunction.addEventSource(new SqsEventSource(productsQueue, {
      batchSize: 1,
    }));

    productsQueue.grantConsumeMessages(productAvailabilityCheckFunction);
    productsTable.grantReadData(productAvailabilityCheckFunction);
    ordersProductListenerQueue.grantSendMessages(productAvailabilityCheckFunction);
  }

}
