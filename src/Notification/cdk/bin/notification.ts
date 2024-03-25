#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NotificationStack } from '../lib/notification-stack';

const app = new cdk.App();
new NotificationStack(app, NotificationStack.name, {});