import * as cdk from "aws-cdk-lib/core"
import type { Construct } from "constructs"
import { AgentCoreConstruct } from "../constructs/agent-core"
import { ApiGwConstruct } from "../constructs/api-gw"
export class AgentCoreStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const _agentCoreConstruct = new AgentCoreConstruct(
      this,
      "AgentCoreConstruct",
    )

    const _apiGwConstruct = new ApiGwConstruct(this, "ApiGwConstruct")
  }
}
