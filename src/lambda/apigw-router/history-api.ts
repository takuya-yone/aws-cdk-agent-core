import { Logger } from "@aws-lambda-powertools/logger"
import type { RouteHandler } from "@hono/zod-openapi"

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import type { ApiGatewayRequestContext, LambdaEvent } from "hono/aws-lambda"

type _Bindings = {
  event: LambdaEvent
  context: ApiGatewayRequestContext
}

const outputSchema = z.object({
  response: z.string(),
})

export const rootRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: outputSchema,
        },
      },
      description: "Invoke the history endpoint",
    },
  },
})

type HistoryRouteResponse200 = z.infer<
  (typeof rootRoute.responses)["200"]["content"]["application/json"]["schema"]
>

const _logger = new Logger()

const historyRouteHandler: RouteHandler<typeof rootRoute> = async (c) => {
  const result: HistoryRouteResponse200 = {
    response: `Sample response for history endpoint`,
  }

  return c.json(result, 200)
}

export const historyApi = new OpenAPIHono().openapi(
  rootRoute,
  historyRouteHandler,
)
