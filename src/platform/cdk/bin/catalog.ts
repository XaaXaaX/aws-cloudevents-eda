#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CatalogPipelineStack } from '../lib/catalog/pipeline-stack';
import { EventCatalogStack } from '../lib/catalog/eventcatalog-stack';
import { ApplyDestroyPolicyAspect } from '../../../cdk-commons/stack/destroy-policy-assets';


const app = new cdk.App();

const eventCatalogStack = new EventCatalogStack(app, EventCatalogStack.name, {});
new CatalogPipelineStack(app, CatalogPipelineStack.name, {
  specsBucket: eventCatalogStack.specsBucket,
  websiteBucket: eventCatalogStack.websiteBucket,
});

cdk.Aspects.of(app).add(
  new ApplyDestroyPolicyAspect());