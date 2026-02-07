import * as agentcore from "@aws-cdk/aws-bedrock-agentcore-alpha"
import * as bedrock from "@aws-cdk/aws-bedrock-alpha"
import * as cdk from "aws-cdk-lib"
import { aws_ecr as ecr, aws_ecr_assets as ecr_assets } from "aws-cdk-lib"
import * as ecrdeploy from "cdk-ecr-deployment"
import { Construct } from "constructs"

export class AgentCoreConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    // const agentRuntimeRepository = new ecr.Repository(
    //   this,
    //   "AgentRuntimeRepository",
    //   {
    //     repositoryName: "agent-runtime-repository",
    //     removalPolicy: cdk.RemovalPolicy.DESTROY,
    //     emptyOnDelete: true,
    //     lifecycleRules: [{ maxImageCount: 3 }],
    //   },
    // )

    // const dockerImageAsset = new ecr_assets.DockerImageAsset(
    //   this,
    //   `agent-runtime-image`,
    //   {
    //     directory: "src/agent",
    //   },
    // )
    // const ecrDeployment = new ecrdeploy.ECRDeployment(this, `agent-runtime-image-deployment`, {
    //   src: new ecrdeploy.DockerImageName(dockerImageAsset.imageUri),
    //   dest: new ecrdeploy.DockerImageName(agentRuntimeRepository.repositoryUri),
    // })

    // const agentRuntimeArtifact =
    //   agentcore.AgentRuntimeArtifact.fromEcrRepository(agentRuntimeRepository)

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
