import { Logger } from "@aws-lambda-powertools/logger"
import { Tracer } from "@aws-lambda-powertools/tracer"
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware"
import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore"
import middy from "@middy/core"
import type { ScheduledEvent } from "aws-lambda"
import { z } from "zod"

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

const inputEventZodSchema = z.object({
  detail: z.object({
    prompt: z.string(),
  }),
})

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
  const parsedEvent = inputEventZodSchema.parse(event)
  const _invokeCommand = invokeCommandFactory({
    prompt: parsedEvent.detail.prompt,
  })

  const runtimeResponse = await agentCoreClient.send(_invokeCommand)
  return runtimeResponse
}

export const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer))
