#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { OrdersStack } from '../lib/orders-stack';
import { OrdersProductListenerStack } from '../lib/products-listener-stack';
import { ApplyDestroyPolicyAspect } from '../../../cdk-commons/stack/destroy-policy-assets';

const app = new cdk.App();
const ordersStack = new OrdersStack(app, OrdersStack.name, {});
new OrdersProductListenerStack(app, OrdersProductListenerStack.name, {
  ordersTable: ordersStack.OrdersTable,
});

cdk.Aspects.of(app).add(new ApplyDestroyPolicyAspect());