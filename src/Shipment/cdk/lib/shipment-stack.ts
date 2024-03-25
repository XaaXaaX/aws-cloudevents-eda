import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join, resolve } from 'path';
import { LambdaConfiguration } from '../../../cdk-commons/helpers/nodejs-bundling';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { FilterOrPolicy, SubscriptionFilter, Topic } from 'aws-cdk-lib/aws-sns';
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { EventBus } from 'aws-cdk-lib/aws-events';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export class ShipmentStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
   
    const telemetryExtensionArnParam =  StringParameter.fromStringParameterName(this, 'TelemetryExtensionArnParam', '/telemetry/kinesis/extension/arn').stringValue;
    const telemetryExtensionPolicyArnParam =  StringParameter.fromStringParameterName(this, 'TelemetryExtensionPolicyArnParam', '/telemetry/kinesis/runtime/policy/arn').stringValue;
    const telemetryManagedPolicy = ManagedPolicy.fromManagedPolicyArn(this, 'TelemetryManagedPolicy', telemetryExtensionPolicyArnParam);
    const telemetryExtensionLayerVersion = LayerVersion.fromLayerVersionArn(this, 'TelemetryExtensionLayerVersion', telemetryExtensionArnParam)
    const lambdaServiceRole = new ServicePrincipal('lambda.amazonaws.com');


    const OrdersTopicArnParam = StringParameter.fromStringParameterName(this, 'OrdersTopicArnParam', '/orders/ingestion/topic/arn').stringValue;
    const ordersTopic = Topic.fromTopicArn(this, 'OrdersTopic', OrdersTopicArnParam);

    const eventBus = new EventBus(this, 'ShipmentEventBus', {});

    const productsQueue = new Queue(this, 'ShipmentQueue', {
      visibilityTimeout: Duration.seconds(30),
      retentionPeriod: Duration.days(14),
      deadLetterQueue: {
        queue: new Queue(this, 'ShipmentDLQ', {}),
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
            'order.placed',
            'order.cancelled',
            'order.confirmed'
          ],
        })),
        dataversion: FilterOrPolicy.filter(SubscriptionFilter.stringFilter({
          allowlist: [
            'v2.0'
          ],
        })),
      }
    }))

    const shipmentPreparationFunctionRole = new Role(this, 'ShipmentPreparationFunctionRole', { assumedBy: lambdaServiceRole });
    shipmentPreparationFunctionRole.addManagedPolicy(telemetryManagedPolicy);

    const shipmentPreparationFunction = new NodejsFunction(this, 'ShipmentPreparationFunction', {
      entry: resolve(join(__dirname, '../../src/service/order-listener/index.ts')),
      handler: 'handler',
      ...LambdaConfiguration,
      layers: [telemetryExtensionLayerVersion],
      role: shipmentPreparationFunctionRole,
      environment: {
        SOURCE: 'ecommerce.shipment.service',
        EVENT_BUS_ARN: eventBus.eventBusArn,
        SCHEMA_URL: 'https://schema.registry.com/v1.0/shipment/'
      }
    });
    
    new LogGroup(this, 'ShipmentPreparationFunctionLogGroup', {
      logGroupName: `/aws/lambda/${shipmentPreparationFunction.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY,
    });

    shipmentPreparationFunction.addEventSource(new SqsEventSource(productsQueue, {
      batchSize: 1,
    }));

    productsQueue.grantConsumeMessages(shipmentPreparationFunction);
    eventBus.grantPutEventsTo(shipmentPreparationFunction);

    new StringParameter(this, 'ShipmentEventBusArnParam', {
      parameterName: '/shipment/eventbus/arn',
      stringValue: eventBus.eventBusArn
    });
  }

}
