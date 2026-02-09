#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core"
import { PipelineStack } from "../lib/pipeline-stack"
import { defaultStackParameters } from "./parameter"

const app = new cdk.App()

const _pipelineStack = new PipelineStack(
  app,
  "PipelineStack",
  defaultStackParameters,
)
