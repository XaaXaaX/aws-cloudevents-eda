#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TelemetryApiKinesisExtensionStack } from '../lib/extension-stack';
import { ApplyDestroyPolicyAspect } from '../../../cdk-commons/stack/destroy-policy-assets';

const app = new cdk.App();

new TelemetryApiKinesisExtensionStack(app, TelemetryApiKinesisExtensionStack.name, {
  extensionName: `kinesis-telemetry-extension`,
  description: 'Telemetry Extension for Kinesis push',
	streamName: 'telemetry-kinesis-stream'
});

cdk.Aspects.of(app).add(
  new ApplyDestroyPolicyAspect());