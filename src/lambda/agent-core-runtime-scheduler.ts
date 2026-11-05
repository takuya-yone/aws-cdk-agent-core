import { Logger } from "@aws-lambda-powertools/logger"
import { Tracer } from "@aws-lambda-powertools/tracer"
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware"
import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore"
import middy from "@middy/core"
import type { ScheduledEvent } from "aws-lambda"

const tracer = new Tracer({})
const logger = new Logger({})

const getRequiredEnv = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

const ENV = {
  AGENT_CORE_RUNTIME_ARN: getRequiredEnv("AGENT_CORE_RUNTIME_ARN"),
}

const agentCoreClient = new BedrockAgentCoreClient({})

const invokeCommandFactory = ({ prompt }: { prompt: string }) => {
  logger.info("Creating InvokeAgentRuntimeCommand with inputs", {
    prompt,
  })
  return new InvokeAgentRuntimeCommand({
    agentRuntimeArn: ENV.AGENT_CORE_RUNTIME_ARN,
    payload: new TextEncoder().encode(
      JSON.stringify({
        prompt: prompt,
      }),
    ),
    qualifier: "DEFAULT",
    contentType: "application/json",
  })
}

export const lambdaHandler = async (event: ScheduledEvent) => {
  logger.info("Received event", { event })
  const invokeCommand = invokeCommandFactory({
    prompt:
      "良さそうな通貨があれば注文を入れて。利益最大化を目指して積極的に取引して。過去の取引履歴も参考にすること",
  })

  const runtimeResponse = await agentCoreClient.send(invokeCommand)

  // response はストリームのため、文字列に変換してから返す（そのままだとJSON化できない）
  const body = (await runtimeResponse.response?.transformToString()) ?? ""
  logger.info("Agent Core Runtime response", {
    runtimeSessionId: runtimeResponse.runtimeSessionId,
    statusCode: runtimeResponse.statusCode,
    body,
  })

  return {
    runtimeSessionId: runtimeResponse.runtimeSessionId,
    statusCode: runtimeResponse.statusCode,
    body,
  }
}

export const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer))
