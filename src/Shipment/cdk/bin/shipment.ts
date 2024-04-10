#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ShipmentStack } from '../lib/shipment-stack';
import { ApplyDestroyPolicyAspect } from '../../../cdk-commons/stack/destroy-policy-assets';

const app = new cdk.App();
new ShipmentStack(app, ShipmentStack.name, {});

cdk.Aspects.of(app).add(
  new ApplyDestroyPolicyAspect());