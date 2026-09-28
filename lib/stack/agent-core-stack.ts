import * as cdk from "aws-cdk-lib/core"
import type { Construct } from "constructs"
import type { StackParameters } from "../../bin/parameter"
import {
  AgentCoreConstruct,
  ApiGwConstruct,
  AuthConstruct,
  CdnConstruct,
  DatastoreConstruct,
  EstateKnowledgeBaseConstruct,
  KnowledgeBaseConstruct,
  Reinvent2026KnowledgeBaseConstruct,
  RssRetrieverConstruct,
} from "../constructs"

export class AgentCoreStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackParameters) {
    super(scope, id, props)

    const datastoreConstruct = new DatastoreConstruct(
      this,
      "DatastoreConstruct",
    )

    const _rssRetrieverConstruct = new RssRetrieverConstruct(
      this,
      "RssRetrieverConstruct",
      {
        rssFeedTable: datastoreConstruct.rssFeedTable,
      },
    )

    const knowledgeBaseConstruct = new KnowledgeBaseConstruct(
      this,
      "KnowledgeBaseConstruct",
    )

    const estateKnowledgeBaseConstruct = new EstateKnowledgeBaseConstruct(
      this,
      "EstateKnowledgeBaseConstruct",
    )

    const reinvent2026KnowledgeBaseConstruct =
      new Reinvent2026KnowledgeBaseConstruct(
        this,
        "Reinvent2026KnowledgeBaseConstruct",
      )

    const agentCoreConstruct = new AgentCoreConstruct(
      this,
      "AgentCoreConstruct",
      {
        agentCoreConfig: props.agentCoreConfig,
        knowledgeBase: knowledgeBaseConstruct.knowledgeBase,
        estateKnowledgeBase: estateKnowledgeBaseConstruct.knowledgeBase,
        reinvent2026KnowledgeBase:
          reinvent2026KnowledgeBaseConstruct.knowledgeBase,
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
      agentCoreLogTable: datastoreConstruct.agentCoreLogTable,
      apiGwConfig: props.apiGwConfig,
    })
  }
}
