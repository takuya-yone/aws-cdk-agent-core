import * as cdk from "aws-cdk-lib"
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines"
import type { Construct } from "constructs"
import { StackStage } from "./pipeline-app-stage"

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const repoName = "aws-cdk-agent-core"
    const repoOwner = "takuya-yone"
    const repoBranch = "main"

    const pipeline = new CodePipeline(this, "AwsCdkAgentCorePipeline", {
      pipelineName: "AwsCdkAgentCorePipeline",
      pipelineType: cdk.aws_codepipeline.PipelineType.V2,
      codeBuildDefaults: {
        buildEnvironment: {
          computeType: cdk.aws_codebuild.ComputeType.SMALL,
          buildImage: cdk.aws_codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_3,
        },
      },
      synthCodeBuildDefaults: {
        buildEnvironment: {
          computeType: cdk.aws_codebuild.ComputeType.SMALL,
          buildImage: cdk.aws_codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_3,
        },
      },
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.gitHub(
          `${repoOwner}/${repoName}`,
          repoBranch,
        ),
        commands: [
          "corepack enable",
          "pnpm install --frozen-lockfile",
          "pnpm run build",
          "pnpm cdk synth",
        ],
      }),
    })

    pipeline.addStage(
      new StackStage(this, "AwsCdkAgentCore", {
        env: {
          account: cdk.Stack.of(this).account,
          region: cdk.Stack.of(this).region,
        },
      }),
    )
  }
}
