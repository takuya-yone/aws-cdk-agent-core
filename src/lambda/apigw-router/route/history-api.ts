import type { RouteHandler } from "@hono/zod-openapi"
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import type { APIGatewayProxyEvent } from "aws-lambda"
import type { ApiGatewayRequestContext } from "hono/aws-lambda"
import { LogModel } from "../schema"
import { logger } from "../utils"

type Bindings = {
  event: APIGatewayProxyEvent
  context: ApiGatewayRequestContext
}

const outputSchema = z.object({
  records: z.array(
    z.object({
      ActorId: z.string(),
      Timestamp: z.string(),
      SessionId: z.string().optional(),
      Input: z.string(),
    }),
  ),
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
  const actorId: string | undefined =
    c.env.event?.requestContext?.authorizer?.claims.sub ?? undefined

  if (!actorId) {
    const result: HistoryRouteResponse200 = {
      records: [],
    }
    logger.info(
      "No actorId found in the request context, returning empty records",
    )
    return c.json(result, 200)
  }

  const logRecords = await LogModel.query("ActorId")
    .where("ActorId")
    .eq(actorId)
    .sort("descending")
    .limit(20)
    .exec()

  logger.info("Fetched log records", {
    actorId,
    count: logRecords.length,
    queriedCount: logRecords.queriedCount,
    timesQueried: logRecords.timesQueried,
  })

  const result: HistoryRouteResponse200 = {
    records: logRecords.map((record) => ({
      ActorId: record.ActorId,
      Timestamp: record.Timestamp,
      SessionId: record.SessionId,
      Input: record.Input,
    })),
  }

  return c.json(result, 200)
}

export const historyApi = new OpenAPIHono<{ Bindings: Bindings }>().openapi(
  historyRoute,
  historyRouteHandler,
)
