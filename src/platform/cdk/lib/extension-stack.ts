import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Effect, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Stream } from 'aws-cdk-lib/aws-kinesis';
import { Architecture, Code, LayerVersion, Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import path = require('path');
import { LambdaConfiguration } from '../../../cdk-commons/helpers/nodejs-bundling';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { KinesisEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { EventBus } from 'aws-cdk-lib/aws-events';
import { CfnDiscoverer, CfnRegistry } from 'aws-cdk-lib/aws-eventschemas';
export interface TelemetryApiExtensionStackProps extends StackProps {
  extensionName: string,
  streamName: string,
  description?: string
}

export class TelemetryApiKinesisExtensionStack extends Stack {

  constructor(scope: Construct, id: string, props: TelemetryApiExtensionStackProps) {
    super(scope, id, props);

    const eventBus = new EventBus(this, 'EventSchemaCentralEventBus');
    const kinesis = new Stream(this, 'TelemetryStream', { streamName: props.streamName });

    const schemaRegisteryFunction = new NodejsFunction(this, 'SchemaRegisteryFunction', {
      entry: path.resolve(path.join(__dirname, '../../src/schema-registerer/index.ts')),
      handler: 'handler',
      ...LambdaConfiguration,
      environment: {
        EVENT_BUS_ARN: eventBus.eventBusArn
      }
    });

    new LogGroup(this, 'SchemaRegisteryFunctionLogGroup', {
      logGroupName: `/aws/lambda/${schemaRegisteryFunction.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY
    });

    schemaRegisteryFunction.addEventSource(new KinesisEventSource(kinesis, {
      batchSize: 1,
      startingPosition: StartingPosition.LATEST,
      bisectBatchOnError: true,
      retryAttempts: 1
    }));

    kinesis.grantRead(schemaRegisteryFunction);
    eventBus.grantPutEventsTo(schemaRegisteryFunction);

    const extension = new LayerVersion(this, 'kinesis-telemetry-api-extension', {
      layerVersionName: `${props?.extensionName}`,
      code: Code.fromAsset(path.resolve(`../src/build`)),
      compatibleArchitectures: [
        Architecture.X86_64,
        Architecture.ARM_64
      ],
      compatibleRuntimes: [
        Runtime.NODEJS_20_X,
      ],
      description: props?.extensionName
    });

    const kinesisManagedPolicy = new ManagedPolicy(this, 'kinesis-telemetry-api-extension-managed-policy', {
      managedPolicyName: `${props?.extensionName}-runtime`,
      statements: [
        new PolicyStatement({
          actions: [
            'kinesis:PutRecord',
            'kinesis:PutRecords'
          ],
          resources: [ 
            kinesis.streamArn
          ],
          effect: Effect.ALLOW
        }),
        new PolicyStatement({
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents'
          ],
          resources: [
            'arn:aws:logs:*:*:*'
          ],
          effect: Effect.ALLOW
        })
      ]
    })

    new StringParameter(this, `kinesis-telemetry-api-extension-arn-param`, {
      parameterName: `/telemetry/kinesis/extension/arn`,
      stringValue: extension.layerVersionArn,
    });
    
    new StringParameter(this, `kinesis-telemetry-api-extension-policy-arn-param`, {
      parameterName: `/telemetry/kinesis/runtime/policy/arn`,
      stringValue: kinesisManagedPolicy.managedPolicyArn
    });
  }
}
