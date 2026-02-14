import { Logger } from "@aws-lambda-powertools/logger"
import type { RouteHandler } from "@hono/zod-openapi"

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import type { APIGatewayProxyEvent } from "aws-lambda"

export const inputSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
})

const outputSchema = z.object({
  response: z.string(),
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

const logger = new Logger()

const invokeRouteHandler: RouteHandler<
  typeof invokeRoute,
  { Bindings: Bindings }
> = async (c) => {
  console.log(c.env.event.headers)
  //   console.log(c, { depth: null })
  console.log(JSON.stringify(c, null, 4))
  const { prompt } = c.req.valid("json")

  const requestContext = c.env.event.requestContext
  const actorId: string | undefined =
    requestContext.authorizer?.claims.sub ?? "unknown"

  logger.info("Received invoke request", { prompt, actorId })

  const result: InvokeRouteResponse200 = {
    response: `Sample response for prompt: ${prompt}`,
  }

  return c.json(result, 200)
}

export const invokeApi = new OpenAPIHono<{ Bindings: Bindings }>().openapi(
  invokeRoute,
  invokeRouteHandler,
)
