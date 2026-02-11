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

export type CognitoClientConfig = {
  domainPrefix: string
  callbackUrls: string[]
  logoutUrls: string[]
}

export interface StackParameters extends cdk.StackProps {
  githubRepoConfig: GithubRepoConfig
  slackChannelConfig: SlackChannelConfig
  cognitoClientConfig: CognitoClientConfig
}

export const defaultStackParameters: StackParameters = {
  githubRepoConfig: {
    repoOwner: "takuya-yone",
    repoName: "aws-cdk-agent-core",
    repoBranch: "main",
  },
  slackChannelConfig: {
    workspaceId: "T068N1FDGHY",
    channelId: "C068FC39686",
  },
  cognitoClientConfig: {
    domainPrefix: "strands-agent-core-auth-domain",
    callbackUrls: ["https://localhost:3000/callback"],
    logoutUrls: ["https://localhost:3000/signout"],
  },
}
