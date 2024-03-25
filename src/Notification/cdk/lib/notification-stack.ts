import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join, resolve } from 'path';
import { LambdaConfiguration } from '../../../cdk-commons/helpers/nodejs-bundling';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { EventBus, Rule, RuleTargetInput } from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export class NotificationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
   
    const telemetryExtensionArnParam =  StringParameter.fromStringParameterName(this, 'TelemetryExtensionArnParam', '/telemetry/kinesis/extension/arn').stringValue;
    const telemetryExtensionPolicyArnParam =  StringParameter.fromStringParameterName(this, 'TelemetryExtensionPolicyArnParam', '/telemetry/kinesis/runtime/policy/arn').stringValue;
    const telemetryManagedPolicy = ManagedPolicy.fromManagedPolicyArn(this, 'TelemetryManagedPolicy', telemetryExtensionPolicyArnParam);
    const telemetryExtensionLayerVersion = LayerVersion.fromLayerVersionArn(this, 'TelemetryExtensionLayerVersion', telemetryExtensionArnParam)
    const lambdaServiceRole = new ServicePrincipal('lambda.amazonaws.com');

    const ShipmentEventBustArnParam = StringParameter.fromStringParameterName(this, 'ShipmentEventBustArnParam', '/shipment/eventbus/arn').stringValue;
    const shipmentEventBus = EventBus.fromEventBusArn(this, 'ShipmentEventBus', ShipmentEventBustArnParam);

    const notificationQueue = new Queue(this, 'NotificationQueue', {
      visibilityTimeout: Duration.seconds(30),
      retentionPeriod: Duration.days(14),
      deadLetterQueue: {
        queue: new Queue(this, 'NotificationDLQ', {}),
        maxReceiveCount: 3,
      },
    });

    const notificationFunctionRole = new Role(this, 'NotificationFunctionRole', { assumedBy: lambdaServiceRole });
    notificationFunctionRole.addManagedPolicy(telemetryManagedPolicy);


    const notificationFunction = new NodejsFunction(this, 'NotificationFunction', {
      entry: resolve(join(__dirname, '../../src/service/notification/index.ts')),
      handler: 'handler',
      ...LambdaConfiguration,
      role: notificationFunctionRole,
      layers: [telemetryExtensionLayerVersion],
      environment: {
        SOURCE: 'ecommerce.notification.service',
        SCHEMA_URL: 'https://schema.registry.com/v1.0/notification/'
      }
    });
    
    new LogGroup(this, 'NotificationLogGroup', {
      logGroupName: `/aws/lambda/${notificationFunction.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY,
    });

    notificationFunction.addEventSource(new SqsEventSource(notificationQueue, {
      batchSize: 1,
    }));
    notificationQueue.grantConsumeMessages(notificationFunction);


    const dlq = new Queue(this, 'dlq', { retentionPeriod: Duration.minutes(5) });
    new Rule(this, 'rule', {
        eventBus: shipmentEventBus,
        eventPattern: {
          detail: {
            type: ['order.shipped'],
            source: ['ecommerce.shipment.service'],
            dataversion: ['v1.0']
          }
        },
        targets: [
          new targets.SqsQueue(notificationQueue, {
            deadLetterQueue: dlq,
            message: RuleTargetInput.fromEventPath('$.detail'),
          }),
        ]
    });
  }
}
