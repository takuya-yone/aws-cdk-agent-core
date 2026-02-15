import { Logger } from "@aws-lambda-powertools/logger"
import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore"
import type { RouteHandler } from "@hono/zod-openapi"
import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import type { APIGatewayProxyEvent } from "aws-lambda"
import type { SSEStreamingApi } from "hono/streaming"
import { streamSSE } from "hono/streaming"
import { customAlphabet } from "nanoid"
import { EventTypeSchema, InputSchema, OutputSchema } from "./schema"

type Bindings = {
  event: APIGatewayProxyEvent
}

export const invokeRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: InputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successful response with SSE stream",
      content: {
        "text/event-stream": {
          schema: OutputSchema,
        },
      },
    },
  },
})

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
)

const logger = new Logger()

const agentCoreClient = new BedrockAgentCoreClient({})

const AGENT_RUNTIME_ARN = process.env.AGENT_RUNTIME_ARN
if (!AGENT_RUNTIME_ARN) {
  throw new Error("AGENT_RUNTIME_ARN is not defined")
}

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

/**
 *
 * @param stream
 * @param reader
 * @see - https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-invoke-agent.html
 */
const responseSse = async (
  stream: SSEStreamingApi,
  reader: ReadableStreamDefaultReader<string>,
) => {
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    const lines = value.split("\n")
    for (const line of lines) {
      if (line) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6))
          const _eventKey = EventTypeSchema.parse(Object.keys(data.event)[0])
          const eventData = OutputSchema.parse(data.event)
          await stream.writeSSE({
            // event: eventKey,
            data: JSON.stringify(eventData),
          })
        }
      }
    }
  }
}

const invokeRouteHandler: RouteHandler<
  typeof invokeRoute,
  { Bindings: Bindings }
> = async (c) => {
  const { prompt } = c.req.valid("json")

  const event = c.env.event

  const actorId: string | undefined = event
    ? event.requestContext.authorizer?.claims.sub
    : `local-user-${nanoid(10)}`

  const sessionId = `${actorId}-default`

  logger.info("invoke request inputs", { prompt, actorId, sessionId })

  const invokeCommand = invokeCommandFactory({
    prompt: prompt,
    actorId: actorId,
    sessionId: sessionId,
  })

  const runtimeResponse = await agentCoreClient.send(invokeCommand)

  if (!runtimeResponse.response) {
    logger.error("No response received from agent runtime", { runtimeResponse })
    return c.json({ message: "No response received from agent runtime" }, 500)
  }

  const responseStream = runtimeResponse.response
    .transformToWebStream()
    .pipeThrough(new TextDecoderStream())
  const responseReader = responseStream.getReader()

  return streamSSE(c, async (stream) => {
    await responseSse(stream, responseReader)
  })
}

export const invokeApi = new OpenAPIHono<{ Bindings: Bindings }>().openapi(
  invokeRoute,
  invokeRouteHandler,
)
