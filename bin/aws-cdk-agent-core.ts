#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core"
import { PipelineStack } from "../lib/pipeline-stack"
import { AgentCoreStack } from "../lib/stack/agent-core-stack"
import { defaultStackParameters } from "./parameter"

const app = new cdk.App()

const _pipelineStack = new PipelineStack(
  app,
  "PipelineStack",
  defaultStackParameters,
)

const _agentCoreStack = new AgentCoreStack(
  app,
  "AgentCoreStack",
  defaultStackParameters,
)
