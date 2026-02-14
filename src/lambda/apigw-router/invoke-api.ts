import { Logger } from "@aws-lambda-powertools/logger"
import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore"
import type { RouteHandler } from "@hono/zod-openapi"
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import type { APIGatewayProxyEvent } from "aws-lambda"

export const inputSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
})

const outputSchema = z.object({
  message: z.string(),
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
      content: {
        "application/json": {
          schema: outputSchema,
        },
      },
      description: "Invoke the agent runtime",
    },
  },
})

type InvokeRouteResponse200 = z.infer<
  (typeof invokeRoute.responses)["200"]["content"]["application/json"]["schema"]
>

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

  const requestContext = c.env.event.requestContext
  const actorId: string | undefined =
    requestContext.authorizer?.claims.sub ?? "unknown"

  const sessionId = `${actorId}-default`

  logger.info("invoke request inputs", { prompt, actorId, sessionId })

  const invokeCommand = invokeCommandFactory({
    prompt: prompt,
    actorId: actorId,
    sessionId: sessionId,
  })

  const runtimeResponse = await agentCoreClient.send(invokeCommand)

  console.log(JSON.stringify(runtimeResponse, null, 2))

  const result: InvokeRouteResponse200 = {
    message: `Sample response for prompt: ${prompt}`,
  }

  return c.json(result, 200)
}

export const invokeApi = new OpenAPIHono<{ Bindings: Bindings }>().openapi(
  invokeRoute,
  invokeRouteHandler,
)
