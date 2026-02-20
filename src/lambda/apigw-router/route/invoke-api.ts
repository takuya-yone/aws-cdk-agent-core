import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore"
import type { RouteHandler } from "@hono/zod-openapi"
import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import type { APIGatewayProxyEvent } from "aws-lambda"
import type { SSEStreamingApi } from "hono/streaming"
import { streamSSE } from "hono/streaming"
import { SERVER_ENV } from "../env"
import { EventTypeSchema, InputSchema, OutputSchema } from "../schema"
import { getActorIdFromEvent, logger } from "../utils"

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
}) => {
  logger.info("Creating InvokeAgentRuntimeCommand with inputs", {
    prompt,
    actorId,
    sessionId,
    traceId,
  })
  return new InvokeAgentRuntimeCommand({
    agentRuntimeArn: SERVER_ENV.AGENT_RUNTIME_ARN,
    payload: new TextEncoder().encode(
      JSON.stringify({
        prompt: prompt,
        actor_id: actorId,
        session_id: sessionId,
      }),
    ),
    qualifier: "DEFAULT",
    traceId: traceId,
    contentType: "application/json",
  })
}

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
  let eventKey: string | undefined
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    const lines = value.split("\n")

    for (const line of lines) {
      if (line) {
        if (line.startsWith("event: ")) {
          eventKey = line.slice(7).trim()
          EventTypeSchema.parse(eventKey)
        }

        if (line.startsWith("data: ")) {
          if (!eventKey) {
            throw new Error("Received data line without preceding event line")
          }
          const data = JSON.parse(line.slice(6))
          OutputSchema.parse(data)
          if (!Object.hasOwn(data, eventKey)) {
            throw new Error(
              `Event type ${eventKey} does not match data keys ${Object.keys(data)}`,
            )
          }
          await stream.writeSSE({
            data: JSON.stringify(data),
            event: eventKey,
            // id: nanoid(10),
            // retry: 3000, // Client will retry after 3 seconds if the connection is lost
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
  const { prompt, sessionId } = c.req.valid("json")

  const actorId: string | undefined = getActorIdFromEvent(c.env.event)

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
