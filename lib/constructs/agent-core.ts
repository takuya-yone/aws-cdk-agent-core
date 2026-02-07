import * as agentcore from "@aws-cdk/aws-bedrock-agentcore-alpha"
import * as bedrock from "@aws-cdk/aws-bedrock-alpha"
import { Construct } from "constructs"

export class AgentCoreConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    const agentRuntimeArtifact =
      agentcore.AgentRuntimeArtifact.fromAsset("src/agent")

    const runtime = new agentcore.Runtime(this, "StrandsAgentRuntime", {
      runtimeName: "StrandsAgentRuntime",
      agentRuntimeArtifact: agentRuntimeArtifact,
      description: "Simple Strands Agent with weather tool",
      
    })

    // CrossRegionInferenceProfileを使った権限付与
    const inferenceProfileSonnet =
      bedrock.CrossRegionInferenceProfile.fromConfig({
        geoRegion: bedrock.CrossRegionInferenceProfileRegion.JP,
        model: bedrock.BedrockFoundationModel.ANTHROPIC_CLAUDE_SONNET_4_5_V1_0,
      })
    inferenceProfileSonnet.grantInvoke(runtime)

    const inferenceProfileNova = bedrock.CrossRegionInferenceProfile.fromConfig(
      {
        geoRegion: bedrock.CrossRegionInferenceProfileRegion.APAC,
        model: bedrock.BedrockFoundationModel.AMAZON_NOVA_PRO_V1,
      },
    )
    inferenceProfileNova.grantInvoke(runtime)
  }
}
