import * as cdk from "aws-cdk-lib/core"
import type { Construct } from "constructs"
import type { StackParameters } from "../../bin/parameter"
import {
  AgentCoreConstruct,
  ApiGwConstruct,
  AuthConstruct,
  CdnConstruct,
  DatastoreConstruct,
  KnowledgeBaseConstruct,
} from "../constructs"

export class AgentCoreStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackParameters) {
    super(scope, id, props)

    const datastoreConstruct = new DatastoreConstruct(
      this,
      "DatastoreConstruct",
    )

    const knowledgeBaseConstruct = new KnowledgeBaseConstruct(
      this,
      "KnowledgeBaseConstruct",
    )

    const agentCoreConstruct = new AgentCoreConstruct(
      this,
      "AgentCoreConstruct",
      {
        knowledgeBase: knowledgeBaseConstruct.knowledgeBase,
        agentCoreLogTable: datastoreConstruct.agentCoreLogTable,
      },
    )

    const cdnConstruct = new CdnConstruct(this, "CdnConstruct")

    const authConstruct = new AuthConstruct(this, "AuthConstruct", {
      distribution: cdnConstruct.distribution,
      cognitoClientConfig: props.cognitoClientConfig,
    })

    const _apiGwConstruct = new ApiGwConstruct(this, "ApiGwConstruct", {
      runtime: agentCoreConstruct.runtime,
      userPool: authConstruct.userPool,
      distribution: cdnConstruct.distribution,
      apiGwConfig: props.apiGwConfig,
    })
  }
}
