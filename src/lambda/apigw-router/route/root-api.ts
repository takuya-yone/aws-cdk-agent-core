import type { RouteHandler } from "@hono/zod-openapi"

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import type { APIGatewayProxyEvent } from "aws-lambda"
import type { ApiGatewayRequestContext } from "hono/aws-lambda"

type Bindings = {
  event: APIGatewayProxyEvent
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
      description: "Invoke the root endpoint",
    },
  },
})

type RootRouteResponse200 = z.infer<
  (typeof rootRoute.responses)["200"]["content"]["application/json"]["schema"]
>

const rootRouteHandler: RouteHandler<
  typeof rootRoute,
  { Bindings: Bindings }
> = async (c) => {
  const result: RootRouteResponse200 = {
    response: `Sample response for root endpoint`,
  }

  return c.json(result, 200)
}

export const rootApi = new OpenAPIHono<{ Bindings: Bindings }>().openapi(
  rootRoute,
  rootRouteHandler,
)
