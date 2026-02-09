import * as cdk from "aws-cdk-lib"
import {
  aws_chatbot as chatbot,
  aws_codepipeline as codepipeline,
  aws_logs as logs,
  aws_sns as sns,
} from "aws-cdk-lib"
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines"
import type { Construct } from "constructs"
import type { StackParameters } from "../bin/parameter"
import { StackStage } from "./pipeline-app-stage"

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackParameters) {
    super(scope, id, props)

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
          `${props.githubRepo.repoOwner}/${props.githubRepo.repoName}`,
          props.githubRepo.repoBranch,
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

    // SNSへの通知を貼るために事前にビルドしておく
    pipeline.buildPipeline()

    const infoSnsTopic = new sns.Topic(this, "AwsCDKAgentCoreInfoSnsTopic", {
      displayName: "AwsCDKAgentCoreInfoSnsTopic",
      topicName: "AwsCDKAgentCoreInfoSnsTopic",
    })

    const alertSnsTopic = new sns.Topic(this, "AwsCDKAgentCoreAlertSnsTopic", {
      displayName: "AwsCDKAgentCoreAlertSnsTopic",
      topicName: "AwsCDKAgentCoreAlertSnsTopic",
    })

    // Chatbot
    const slackChatbot = new chatbot.SlackChannelConfiguration(
      this,
      "Chatbot",
      {
        slackChannelConfigurationName: "PipelineNotification",
        slackWorkspaceId: props.slackChannel.workspaceId,
        slackChannelId: props.slackChannel.channelId,
        logRetention: logs.RetentionDays.ONE_MONTH, // CloudWatch Logs の保持期間をお好みで
        userRoleRequired: true,
      },
    )
    slackChatbot.addNotificationTopic(infoSnsTopic)
    slackChatbot.addNotificationTopic(alertSnsTopic)

    pipeline.pipeline.notifyOn("NotifyOnSuccess", infoSnsTopic, {
      events: [
        codepipeline.PipelineNotificationEvents.PIPELINE_EXECUTION_SUCCEEDED,
        codepipeline.PipelineNotificationEvents.MANUAL_APPROVAL_SUCCEEDED,
      ],
    })
    pipeline.pipeline.notifyOn("NotifyOnFailure", alertSnsTopic, {
      events: [
        codepipeline.PipelineNotificationEvents.PIPELINE_EXECUTION_FAILED,
      ],
    })
  }
}
