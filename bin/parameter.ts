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

export type AgentCoreConfig = {
  modelId: string
  kbModelId: string
  kbResultNums: number
  estateKbResultNums: number
}

export interface StackParameters extends cdk.StackProps {
  githubRepoConfig: GithubRepoConfig
  slackChannelConfig: SlackChannelConfig
  cognitoClientConfig: CognitoClientConfig
  apiGwConfig: ApiGwConfig
  agentCoreConfig: AgentCoreConfig
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
      "http://localhost:3000/callback",
      "http://localhost:4173/callback",
      "http://localhost:5173/callback",
    ],
    logoutUrls: [
      "http://localhost:3000/logout",
      "http://localhost:4173/logout",
      "http://localhost:5173/logout",
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
  agentCoreConfig: {
    modelId: "global.amazon.nova-2-lite-v1:0",
    kbModelId: "global.amazon.nova-2-lite-v1:0",
    kbResultNums: 5,
    estateKbResultNums: 5,
  },
}
