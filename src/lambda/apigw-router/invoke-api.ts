import { Logger } from "@aws-lambda-powertools/logger"
import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore"
import type { RouteHandler } from "@hono/zod-openapi"
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import type { APIGatewayProxyEvent } from "aws-lambda"
import { stream } from "hono/streaming"

export const inputSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
})

const outputSchema = z.object({
  event: z.enum(["start", "token", "end", "error"]),
  data: z.string(),
})

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
          schema: inputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successful response with SSE stream",
      content: {
        "text/event-stream": {
          schema: outputSchema,
        },
      },
    },
  },
})

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

const logger = new Logger()

const AGENT_RUNTIME_ARN = process.env.AGENT_RUNTIME_ARN
if (!AGENT_RUNTIME_ARN) {
  throw new Error("AGENT_RUNTIME_ARN is not defined")
}

const agentCoreClient = new BedrockAgentCoreClient({})

const invokeRouteHandler: RouteHandler<
  typeof invokeRoute,
  { Bindings: Bindings }
> = async (c) => {
  const { prompt } = c.req.valid("json")

  const event = c.env.event

  const actorId: string | undefined = event ? event.requestContext.authorizer?.claims.sub : 'local-user'

  console.log("actorId", actorId)

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

  const webStream = runtimeResponse.response.transformToWebStream()

  return stream(c, async (stream) => {
    // Write a process to be executed when aborted.
    stream.onAbort(() => {
      console.log("Aborted!")
    })
    await stream.pipe(webStream)
  })
}

export const invokeApi = new OpenAPIHono<{ Bindings: Bindings }>().openapi(
  invokeRoute,
  invokeRouteHandler,
)
