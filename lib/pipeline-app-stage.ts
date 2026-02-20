import * as cdk from "aws-cdk-lib"
import type { Construct } from "constructs"
import { defaultStackParameters } from "../bin/parameter"
import { AgentCoreStack, SampleStack } from "./stack"

export class StackStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props)

    const agentCoreStack = new AgentCoreStack(
      this,
      "AgentCoreStack",
      defaultStackParameters,
    )

    const sampleStack1 = new SampleStack(this, "SampleStack1")
    const sampleStack2 = new SampleStack(this, "SampleStack2")
    const sampleStack3 = new SampleStack(this, "SampleStack3")

    cdk.Tags.of(agentCoreStack).add("Project", "AwsCdkAgentCore")
    cdk.Tags.of(sampleStack1).add("Project", "AwsCdkAgentCore")
    cdk.Tags.of(sampleStack2).add("Project", "AwsCdkAgentCore")
    cdk.Tags.of(sampleStack3).add("Project", "AwsCdkAgentCore")
  }
}
