import * as cdk from "aws-cdk-lib"
import {
  aws_codestarnotifications as notifications,
  aws_sns as sns,
} from "aws-cdk-lib"
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

    const infoSnsTopic = new sns.Topic(this, "AwsCDKAgentCoreInfoSnsTopic", {
      displayName: "AwsCDKAgentCoreInfoSnsTopic",
      topicName: "AwsCDKAgentCoreInfoSnsTopic",
    })

    const alertSnsTopic = new sns.Topic(this, "AwsCDKAgentCoreAlertSnsTopic", {
      displayName: "AwsCDKAgentCoreAlertSnsTopic",
      topicName: "AwsCDKAgentCoreAlertSnsTopic",
    })

    new notifications.NotificationRule(
      this,
      "pipeline-notification-succeeded",
      {
        notificationRuleName: `pipeline-notification-succeeded`,
        source: pipeline.pipeline,
        events: [
          "codepipeline-pipeline-pipeline-execution-succeeded",
          "codepipeline-pipeline-manual-approval-succeeded",
        ],
        targets: [infoSnsTopic],
      },
    )

    new notifications.NotificationRule(this, "pipeline-notification-failed", {
      notificationRuleName: "pipeline-notification-failed",
      source: pipeline.pipeline,
      events: ["codepipeline-pipeline-pipeline-execution-failed"],
      targets: [alertSnsTopic],
    })
  }
}
