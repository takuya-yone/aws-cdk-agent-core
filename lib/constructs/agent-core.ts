import * as agentcore from "@aws-cdk/aws-bedrock-agentcore-alpha"
import * as bedrock from "@aws-cdk/aws-bedrock-alpha"
import * as cdk from "aws-cdk-lib"
import { aws_secretsmanager } from "aws-cdk-lib"
import { Construct } from "constructs"

export class AgentCoreConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id)

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

    // CrossRegionInferenceProfileの作成(Amazon Nova Pro APACリージョン)
    const inferenceProfileNovaUs =
      bedrock.CrossRegionInferenceProfile.fromConfig({
        geoRegion: bedrock.CrossRegionInferenceProfileRegion.US,
        model: bedrock.BedrockFoundationModel.AMAZON_NOVA_PRO_V1,
      })

    // Secrets Managerの作成(Tavily API Key)
    const tavilySecret = new aws_secretsmanager.Secret(this, "TavilySecret", {
      secretName: "TavilySecret",
    })

    // Runtimeの作成
    const runtime = new agentcore.Runtime(this, "StrandsAgentRuntime", {
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
      },
    })

    // Runtimeへの権限付与
    inferenceProfileSonnet.grantInvoke(runtime)
    inferenceProfileNova.grantInvoke(runtime)
    inferenceProfileNovaUs.grantInvoke(runtime)
    tavilySecret.grantRead(runtime)
    //     runtime.addToRolePolicy(
    //   new iam.PolicyStatement({
    //     effect: iam.Effect.ALLOW,
    //     actions: [
    //       "bedrock:InvokeModel",
    //       "bedrock:InvokeModelWithResponseStream",
    //     ],
    //     resources: [
    //       `arn:aws:bedrock:${cdk.Stack.of(this).region}::foundation-model/*`,
    //     ],
    //   }),
    // );
  }
}
