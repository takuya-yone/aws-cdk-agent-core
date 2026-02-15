import * as cdk from "aws-cdk-lib"
import type { Construct } from "constructs"
import { defaultStackParameters } from "../bin/parameter"
import { AgentCoreStack, SampleStack } from "./stack"

export class StackStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props)

    const _agentCoreStack = new AgentCoreStack(
      this,
      "AgentCoreStack",
      defaultStackParameters,
    )

    const _sampleStack1 = new SampleStack(this, "SampleStack1")
    const _sampleStack2 = new SampleStack(this, "SampleStack2")
    const _sampleStack3 = new SampleStack(this, "SampleStack3")
  }
}
