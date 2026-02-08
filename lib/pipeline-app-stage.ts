import * as cdk from "aws-cdk-lib"
import type { Construct } from "constructs"
import { AgentCoreStack } from "./stack/agent-core-stack"
import { SampleStack } from "./stack/sample-stack"

export class StackStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props)

    const _agentCoreStack = new AgentCoreStack(this, "AgentCoreStack")

    const _sampleStack = new SampleStack(this, "SampleStack")
  }
}
