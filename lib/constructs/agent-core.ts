import * as agentcore from "@aws-cdk/aws-bedrock-agentcore-alpha"
import * as bedrock from "@aws-cdk/aws-bedrock-alpha"
import * as cdk from "aws-cdk-lib"
import {
  type aws_bedrock,
  type aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_secretsmanager as secretsmanager,
} from "aws-cdk-lib"
import { Construct } from "constructs"

export type AgentCoreConstructProps = {
  knowledgeBase: aws_bedrock.CfnKnowledgeBase
  estateKnowledgeBase: aws_bedrock.CfnKnowledgeBase
  agentCoreLogTable: dynamodb.TableV2
}
export class AgentCoreConstruct extends Construct {
  public readonly runtime: agentcore.Runtime
  constructor(scope: Construct, id: string, props: AgentCoreConstructProps) {
    super(scope, id)

    const kbAccessPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["bedrock:RetrieveAndGenerate", "bedrock:Retrieve"],
      resources: [
        props.knowledgeBase.attrKnowledgeBaseArn,
        props.estateKnowledgeBase.attrKnowledgeBaseArn,
      ],
    })

    // CrossRegionInferenceProfileの作成(Anthropic Claude Sonnet 4.5 Japanリージョン)
    const inferenceProfileSonnet =
      bedrock.CrossRegionInferenceProfile.fromConfig({
        geoRegion: bedrock.CrossRegionInferenceProfileRegion.JP,
        model: bedrock.BedrockFoundationModel.ANTHROPIC_CLAUDE_SONNET_4_5_V1_0,
      })

    // CrossRegionInferenceProfileの作成(Amazon Nova Pro APACリージョン)
    const inferenceProfileNova = bedrock.CrossRegionInferenceProfile.fromConfig(
      {
        geoRegion: bedrock.CrossRegionInferenceProfileRegion.APAC,
        model: bedrock.BedrockFoundationModel.AMAZON_NOVA_PRO_V1,
      },
    )

    // CrossRegionInferenceProfileの作成(Amazon Nova Pro USリージョン)
    const inferenceProfileNovaUs =
      bedrock.CrossRegionInferenceProfile.fromConfig({
        geoRegion: bedrock.CrossRegionInferenceProfileRegion.US,
        model: bedrock.BedrockFoundationModel.AMAZON_NOVA_PRO_V1,
      })

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
      description: "Simple Strands Agent",
      environmentVariables: {
        AWS_DEFAULT_REGION: cdk.Stack.of(this).region,
        POWERTOOLS_SERVICE_NAME: "StrandsAgentRuntime",
        // MODEL_ID: "jp.anthropic.claude-sonnet-4-5-20250929-v1:0",
        MODEL_ID: "apac.amazon.nova-pro-v1:0",
        // MODEL_ID: "us.amazon.nova-pro-v1:0",
        TAVILY_SECRET_NAME: tavilySecret.secretName,
        MEMORY_ID: memory.memoryId,
        BEDROCK_KB_ID: props.knowledgeBase.ref,
        BEDROCK_ESTATE_KB_ID: props.estateKnowledgeBase.ref,
        LOG_TABLE_NAME: props.agentCoreLogTable.tableName,
        KB_RESULT_NUMS: "10",
        ESTATE_KB_RESULT_NUMS: "50",
      },
    })

    // Runtimeへの権限付与
    inferenceProfileSonnet.grantInvoke(this.runtime)
    inferenceProfileNova.grantInvoke(this.runtime)
    inferenceProfileNovaUs.grantInvoke(this.runtime)
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
