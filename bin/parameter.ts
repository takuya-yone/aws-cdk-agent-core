import type * as cdk from "aws-cdk-lib"
import { Duration } from "aws-cdk-lib"

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

export type ApiGwConfig = {
  stageName: string
  timeoutSeconds: { buffered: Duration; stream: Duration }
  referer: string
  historyItemLimit: number
}

export interface StackParameters extends cdk.StackProps {
  githubRepoConfig: GithubRepoConfig
  slackChannelConfig: SlackChannelConfig
  cognitoClientConfig: CognitoClientConfig
  apiGwConfig: ApiGwConfig
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
    callbackUrls: [
      "http://localhost:3000",
      "http://localhost:4173",
      "http://localhost:5173",
    ],
    logoutUrls: [
      "http://localhost:3000",
      "http://localhost:4173",
      "http://localhost:5173",
    ],
  },
  apiGwConfig: {
    stageName: "v1",
    timeoutSeconds: {
      buffered: Duration.seconds(90),
      stream: Duration.seconds(300),
    },
    referer: "7aed273c-ec57-9ab8-269a-ca4b23e627d8",
    historyItemLimit: 30,
  },
}
