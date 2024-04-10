#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductsStack } from '../lib/products-stack';
import { ApplyDestroyPolicyAspect } from '../../../cdk-commons/stack/destroy-policy-assets';

const app = new cdk.App();
new ProductsStack(app, ProductsStack.name, {});

cdk.Aspects.of(app).add(
  new ApplyDestroyPolicyAspect());