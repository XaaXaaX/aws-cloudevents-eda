#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NotificationStack } from '../lib/notification-stack';
import { ApplyDestroyPolicyAspect } from '../../../cdk-commons/stack/destroy-policy-assets';

const app = new cdk.App();
new NotificationStack(app, NotificationStack.name, {});

cdk.Aspects.of(app).add(new ApplyDestroyPolicyAspect());