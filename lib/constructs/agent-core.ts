import * as agentcore from "@aws-cdk/aws-bedrock-agentcore-alpha"
import * as cdk from "aws-cdk-lib"
import {
  type aws_bedrock,
  type aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_secretsmanager as secretsmanager,
} from "aws-cdk-lib"
import { Construct } from "constructs"
import type { AgentCoreConfig } from "../../bin/parameter"

export type AgentCoreConstructProps = {
  agentCoreConfig: AgentCoreConfig
  knowledgeBase: aws_bedrock.CfnKnowledgeBase
  estateKnowledgeBase: aws_bedrock.CfnKnowledgeBase
  agentCoreLogTable: dynamodb.TableV2
}
export class AgentCoreConstruct extends Construct {
  public readonly runtime: agentcore.Runtime
  constructor(scope: Construct, id: string, props: AgentCoreConstructProps) {
    super(scope, id)

    // Secrets Managerの作成(Tavily API Key)
    const tavilySecret = new secretsmanager.Secret(this, "TavilySecret", {
      secretName: "TavilySecret",
    })

    // AgentCore Memoryの作成
    const memory = new agentcore.Memory(this, "AgentCoreMemory", {
      memoryName: "AgentCoreMemory",
      description: "Memory for Strands Agent",
      expirationDuration: cdk.Duration.days(7),
      memoryStrategies: [
        agentcore.MemoryStrategy.usingSummarization({
          name: "SummarizationStrategy",
          namespaces: [
            "/strategies/summary/actors/{actorId}/sessions/{sessionId}",
          ],
        }),
        agentcore.MemoryStrategy.usingSemantic({
          name: "SemanticStrategy",
          namespaces: ["/strategies/semantic/actors/{actorId}"],
        }),
        agentcore.MemoryStrategy.usingUserPreference({
          name: "UserPreferenceStrategy",
          namespaces: ["/strategies/preference/actors/{actorId}"],
        }),
        agentcore.MemoryStrategy.usingEpisodic({
          name: "EpisodicStrategy",
          namespaces: [
            "/strategies/episodic/actors/{actorId}/session/{sessionId}",
          ],
          reflectionConfiguration: {
            namespaces: ["/strategies/episodic/actors/{actorId}"],
          },
        }),
      ],
    })

    // Runtimeの作成
    this.runtime = new agentcore.Runtime(this, "StrandsAgentRuntime", {
      runtimeName: "StrandsAgentRuntime",
      agentRuntimeArtifact:
        agentcore.AgentRuntimeArtifact.fromAsset("src/agent"),
      description: "StrandsAgentRuntime",
      environmentVariables: {
        AWS_DEFAULT_REGION: cdk.Stack.of(this).region,
        POWERTOOLS_SERVICE_NAME: "StrandsAgentRuntime",
        MODEL_ID: props.agentCoreConfig.modelId,
        KB_MODEL_ID: props.agentCoreConfig.kbModelId,
        TAVILY_SECRET_NAME: tavilySecret.secretName,
        MEMORY_ID: memory.memoryId,
        BEDROCK_KB_ID: props.knowledgeBase.ref,
        BEDROCK_ESTATE_KB_ID: props.estateKnowledgeBase.ref,
        LOG_TABLE_NAME: props.agentCoreLogTable.tableName,
        KB_RESULT_NUMS: props.agentCoreConfig.kbResultNums.toString(),
        ESTATE_KB_RESULT_NUMS:
          props.agentCoreConfig.estateKbResultNums.toString(),
      },
    })

    const kbAccessPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["bedrock:RetrieveAndGenerate", "bedrock:Retrieve"],
      resources: [
        props.knowledgeBase.attrKnowledgeBaseArn,
        props.estateKnowledgeBase.attrKnowledgeBaseArn,
      ],
    })

    // Runtimeへの権限付与
    this.runtime.role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonBedrockLimitedAccess"),
    )
    tavilySecret.grantRead(this.runtime)
    memory.grantWrite(this.runtime)
    memory.grantRead(this.runtime)
    memory.grantDelete(this.runtime)
    this.runtime.addToRolePolicy(kbAccessPolicyStatement)
    props.agentCoreLogTable.grantReadWriteData(this.runtime)

    // AWS環境調査用
    this.runtime.role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("ReadOnlyAccess"),
    )
  }
}
