#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core"
import { PipelineStack } from "../lib/pipeline-stack"

const app = new cdk.App()

const _pipelineStack = new PipelineStack(app, "PipelineStack", {})
