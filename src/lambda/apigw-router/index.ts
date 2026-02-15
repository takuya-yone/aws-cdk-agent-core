import { streamHandle } from "hono/aws-lambda"
// import { streamText } from 'hono/streaming'

import { Logger } from "@aws-lambda-powertools/logger"
import { serve } from "@hono/node-server"
import { swaggerUI } from "@hono/swagger-ui"
import { OpenAPIHono } from "@hono/zod-openapi"
import type { Handler } from "aws-lambda"
import { handle } from "hono/aws-lambda"
import { invokeApi } from "./invoke-api"
import { rootApi } from "./root-api"

const logger = new Logger()

const app = new OpenAPIHono()
  .route("/", rootApi)
  .route("/invoke", invokeApi)
  .doc("/specification", {
    openapi: "3.0.0",
    info: {
      title: "API",
      version: "1.0.0",
    },
  })
  .get(
    "/doc",
    swaggerUI({
      url: "/specification",
    }),
  )

app.onError((err, c) => {
  logger.error("Unhandled error", { error: err.message, stack: err.stack })
  return c.json({ message: "Internal Server Error", details: err.message }, 500)
})

export const streamHandler: Handler = streamHandle(app)

export const handler: Handler = handle(app)

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`) // Listening on http://localhost:3000
})
