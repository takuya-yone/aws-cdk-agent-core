import * as cdk from "aws-cdk-lib"
import type { Construct } from "constructs"
import { AgentCoreStack } from "./agent-core-stack"

export class AgentCoreStackStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props)

    const _agentCoreStack = new AgentCoreStack(this, "AgentCoreStack")
  }
}
