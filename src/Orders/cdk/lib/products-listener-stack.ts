import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join, resolve } from 'path';
import { LambdaConfiguration } from '../../../cdk-commons/helpers/nodejs-bundling';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

interface OrdersProductListenerStackProps extends StackProps {
  ordersTable: ITable;
}  

export class OrdersProductListenerStack extends Stack {
  constructor(scope: Construct, id: string, props: OrdersProductListenerStackProps) {
    super(scope, id, props);
    const telemetryExtensionArnParam =  StringParameter.fromStringParameterName(this, 'TelemetryExtensionArnParam', '/telemetry/kinesis/extension/arn').stringValue;
    const telemetryExtensionPolicyArnParam =  StringParameter.fromStringParameterName(this, 'TelemetryExtensionPolicyArnParam', '/telemetry/kinesis/runtime/policy/arn').stringValue;
    const telemetryManagedPolicy = ManagedPolicy.fromManagedPolicyArn(this, 'TelemetryManagedPolicy', telemetryExtensionPolicyArnParam);
    const telemetryExtensionLayerVersion = LayerVersion.fromLayerVersionArn(this, 'TelemetryExtensionLayerVersion', telemetryExtensionArnParam)
    const lambdaServiceRole = new ServicePrincipal('lambda.amazonaws.com');

    const orderQueue = new Queue(this, 'ProductListenerQueue', {
      visibilityTimeout: Duration.seconds(30),
      retentionPeriod: Duration.days(14),
      deadLetterQueue: {
        queue: new Queue(this, 'OrdersProductListenerDLQ', {}),
        maxReceiveCount: 3,
      },
    });

    const productAvailabilityConfirmedFunctionRole = new Role(this, 'OrderProductAvailabilityFunctionRole', { assumedBy: lambdaServiceRole });
    productAvailabilityConfirmedFunctionRole.addManagedPolicy(telemetryManagedPolicy);

    const productAvailabilityConfirmedFunction = new NodejsFunction(this, 'OrderProductAvailabilityFunction', {
      entry: resolve(join(__dirname, '../../src/service/product-listener/confirmed-availability/index.ts')),
      handler: 'handler',
      ...LambdaConfiguration,
      role: productAvailabilityConfirmedFunctionRole,
      layers: [
        telemetryExtensionLayerVersion
      ],
      environment: {
        SOURCE: 'ecommerce.orders.product-listener',
        TABLE_NAME: props.ordersTable.tableName,
      }
    });

    new LogGroup(this, 'OrderProductAvailabilityFunctionLogGroup', {
      logGroupName: `/aws/lambda/${productAvailabilityConfirmedFunction.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY
    });

    productAvailabilityConfirmedFunction.addEventSource(new SqsEventSource(orderQueue, {
      batchSize: 1,
    }));

    props.ordersTable.grantWriteData(productAvailabilityConfirmedFunction);

    new StringParameter(this, 'ProductListenerQueueUrl', {
      parameterName: '/orders/product-listener/queue/url',
      stringValue: orderQueue.queueUrl
    });

    new StringParameter(this, 'ProductListenerQueueArn', {
      parameterName: '/orders/product-listener/queue/arn',
      stringValue: orderQueue.queueArn
    });
  }
}
