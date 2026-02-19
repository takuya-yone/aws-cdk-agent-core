import type { RouteHandler } from "@hono/zod-openapi"
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import type { APIGatewayProxyEvent } from "aws-lambda"
import type { ApiGatewayRequestContext } from "hono/aws-lambda"
import { logger } from "../utils"

type Bindings = {
  event: APIGatewayProxyEvent
  context: ApiGatewayRequestContext
}

const outputSchema = z.object({
  response: z.string(),
})

export const historyRoute = createRoute({
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
  (typeof historyRoute.responses)["200"]["content"]["application/json"]["schema"]
>

const historyRouteHandler: RouteHandler<
  typeof historyRoute,
  { Bindings: Bindings }
> = async (c) => {
  const event = c.env.event

  const actorId: string | undefined =
    event.requestContext.authorizer?.claims.sub ?? undefined

  logger.info(actorId ?? "Unknown actor")

  const result: HistoryRouteResponse200 = {
    response: `Sample response for history endpoint`,
  }

  return c.json(result, 200)
}

export const historyApi = new OpenAPIHono<{ Bindings: Bindings }>().openapi(
  historyRoute,
  historyRouteHandler,
)
