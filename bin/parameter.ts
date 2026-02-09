import type * as cdk from "aws-cdk-lib"

type GithubRepoConfig = {
  repoName: string
  repoOwner: string
  repoBranch: string
}

type SlackChannelConfig = {
  workspaceId: string
  channelId: string
}

export interface StackParameters extends cdk.StackProps {
  githubRepo: GithubRepoConfig
  slackChannel: SlackChannelConfig
}

export const defaultStackParameters: StackParameters = {
  githubRepo: {
    repoOwner: "takuya-yone",
    repoName: "aws-cdk-agent-core",
    repoBranch: "main",
  },
  slackChannel: {
    workspaceId: "T068N1FDGHY",
    channelId: "C068FC39686",
  },
}
