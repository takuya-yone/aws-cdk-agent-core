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

    const pipeline = new CodePipeline(this, "Pipeline", {
      // pipelineName: "Pipeline",
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.gitHub(
          `${repoOwner}/${repoName}`,
          repoBranch,
        ),
        commands: [
          "npm -g install pnpm",
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
