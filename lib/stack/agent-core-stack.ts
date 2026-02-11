import * as cdk from "aws-cdk-lib/core"
import type { Construct } from "constructs"
import { AgentCoreConstruct } from "../constructs/agent-core"
import { ApiGwConstruct } from "../constructs/api-gw"
import { AuthConstruct } from "../constructs/auth"
export class AgentCoreStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const agentCoreConstruct = new AgentCoreConstruct(
      this,
      "AgentCoreConstruct",
    )

    const authConstruct = new AuthConstruct(this, "AuthConstruct")

    const _apiGwConstruct = new ApiGwConstruct(this, "ApiGwConstruct", {
      runtime: agentCoreConstruct.runtime,
      cognitoAuthorizer: authConstruct.cognitoAuthorizer,
    })
  }
}
