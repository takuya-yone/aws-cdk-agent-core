#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core"
// import { AgentCoreStack } from "../lib/agent-core-stack"
import { PipelineStack } from "../lib/pipeline-stack"

const app = new cdk.App()
// const _agentCoreStack = new AgentCoreStack(app, "AgentCoreStack", {})

const _pipelineStack = new PipelineStack(app, "PipelineStack", {})
