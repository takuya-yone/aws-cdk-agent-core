#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { AwsCdkAgentCoreStack } from '../lib/aws-cdk-agent-core-stack';

const app = new cdk.App();
const _awsCdkAgentCoreStack = new AwsCdkAgentCoreStack(app, 'AwsCdkAgentCoreStack', {
});
