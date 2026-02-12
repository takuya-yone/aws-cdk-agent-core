import {
  type Readable,
  pipeline as streamPipeline,
  type Writable,
} from "node:stream"
import { promisify } from "node:util"
import { Logger } from "@aws-lambda-powertools/logger"
import { Tracer } from "@aws-lambda-powertools/tracer"
import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore"

import type { APIGatewayProxyEvent, Context } from "aws-lambda"
import { z } from "zod"

// import middy from "@middy/core"
// import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware"

// SSE (Server-Sent Events) で応答する
const HTTP_RESPONSE_META_DATA = {
  statusCode: 200,
  headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  },
}

const _tracer = new Tracer({})
const logger = new Logger({})

const eventBodySchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
})

const AGENT_RUNTIME_ARN = process.env.AGENT_RUNTIME_ARN
if (!AGENT_RUNTIME_ARN) {
  throw new Error("AGENT_RUNTIME_ARN is not defined")
}

const agentCoreClient = new BedrockAgentCoreClient({})

const invokeCommandFactory = ({
  prompt,
  actorId,
  sessionId,
  traceId,
}: {
  prompt: string
  actorId?: string
  sessionId?: string
  traceId?: string
}) =>
  new InvokeAgentRuntimeCommand({
    agentRuntimeArn: AGENT_RUNTIME_ARN,
    payload: new TextEncoder().encode(
      JSON.stringify({
        prompt: prompt,
        actor_id: actorId,
        session_id: sessionId,
      }),
    ),
    qualifier: "DEFAULT",
    traceId: traceId,
  })

const asyncPipeline = promisify(streamPipeline)

const streamHandler = async (
  event: APIGatewayProxyEvent,
  responseStream: awslambda.HttpResponseStream,
  _context: Context,
) => {
  logger.info("Received event", { event })

  const commandInput = eventBodySchema.parse(JSON.parse(event.body || "{}"))
  const requestContext = event.requestContext
  const actorId: string | undefined =
    requestContext.authorizer?.claims.sub ?? "unknown"

  const sessionId = `${actorId}-default`

  const invokeCommand = invokeCommandFactory({
    prompt: commandInput.prompt,
    actorId: actorId,
    sessionId: sessionId,
  })

  responseStream = awslambda.HttpResponseStream.from(
    responseStream as Writable,
    HTTP_RESPONSE_META_DATA,
  )

  try {
    const runtimeResponse = await agentCoreClient.send(invokeCommand)
    // 入力ストリーム (AgentCore Runtime からのレスポンス) から出力ストリーム (クライアントへのレスポンス) へデータを送信
    await asyncPipeline(runtimeResponse.response as Readable, responseStream)
  } catch (e) {
    responseStream.write("Error!")
    if (e instanceof Error) {
      responseStream.write(` - ${e.message}`)
    }
    responseStream.end()
  }
}

// const lambdaHandler = middy(streamHandler).use(captureLambdaHandler(tracer))
export const handler = awslambda.streamifyResponse(streamHandler)
