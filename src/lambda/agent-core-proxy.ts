import {
  type Readable,
  pipeline as streamPipeline,
  type Writable,
} from "node:stream"
import { promisify } from "node:util"
import { Logger } from "@aws-lambda-powertools/logger"
import { Tracer } from "@aws-lambda-powertools/tracer"
// import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware"
import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore"
// import middy from "@middy/core"
import type { APIGatewayProxyEvent, Context } from "aws-lambda"
import { z } from "zod"

const _tracer = new Tracer({})
const logger = new Logger({})

const EventBodySchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
})

const AGENT_RUNTIME_ARN = process.env.AGENT_RUNTIME_ARN
if (!AGENT_RUNTIME_ARN) {
  throw new Error("AGENT_RUNTIME_ARN is not defined")
}

const agentCoreClient = new BedrockAgentCoreClient({})

const invokeCommandFactory = (prompt: string) =>
  new InvokeAgentRuntimeCommand({
    agentRuntimeArn: AGENT_RUNTIME_ARN,
    // runtimeSessionId: requestParams.sessionId,
    payload: new TextEncoder().encode(JSON.stringify({ prompt: prompt })),
    qualifier: "DEFAULT",
  })

const asyncPipeline = promisify(streamPipeline)

const streamHandler = async (
  event: APIGatewayProxyEvent,
  responseStream: awslambda.HttpResponseStream,
  _context: Context,
) => {


  const payload = EventBodySchema.parse(JSON.parse(event.body || "{}"))

  logger.info("Received event", { payload })


  const invokeCommand = invokeCommandFactory(payload.prompt)

  // SSE (Server-Sent Events) で応答する
  const httpResponseMetadata = {
    statusCode: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  }
  responseStream = awslambda.HttpResponseStream.from(
    responseStream as Writable,
    httpResponseMetadata,
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
