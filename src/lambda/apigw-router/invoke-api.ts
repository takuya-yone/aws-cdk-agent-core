import { Logger } from "@aws-lambda-powertools/logger"
import type { RouteHandler } from "@hono/zod-openapi"

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import type { ApiGatewayRequestContext } from "hono/aws-lambda"

type _Bindings = {
  //   event: LambdaEvent
  context: ApiGatewayRequestContext
}

// type Bindings = {
//   requestContext: ApiGatewayRequestContext
// }

export const inputSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
})

const outputSchema = z.object({
  response: z.string(),
})

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

const _logger = new Logger()

const invokeRouteHandler: RouteHandler<typeof invokeRoute> = async (c) => {
  //   console.log(c.env.event.requestContext)
  console.dir(c, { depth: null })
  const { prompt } = c.req.valid("json")
  const result: InvokeRouteResponse200 = {
    response: `Sample response for prompt: ${prompt}`,
  }

  return c.json(result, 200)
}

export const invokeApi = new OpenAPIHono().openapi(
  invokeRoute,
  invokeRouteHandler,
)
