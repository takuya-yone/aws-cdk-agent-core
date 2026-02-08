import * as cdk from "aws-cdk-lib/core"
import type { Construct } from "constructs"
import { AgentCoreConstruct } from "./constructs"
export class AgentCoreStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const _agentCoreConstruct = new AgentCoreConstruct(
      this,
      "AgentCoreConstruct",
    )
  }
}
