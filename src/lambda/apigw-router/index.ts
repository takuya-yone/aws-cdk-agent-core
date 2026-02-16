import { Logger } from "@aws-lambda-powertools/logger"
import { swaggerUI } from "@hono/swagger-ui"
import { OpenAPIHono } from "@hono/zod-openapi"
import type { Handler } from "aws-lambda"
import { handle, streamHandle } from "hono/aws-lambda"
import { cors } from "hono/cors"
import { invokeApi } from "./invoke-api"
import { rootApi } from "./root-api"

const logger = new Logger()

const app = new OpenAPIHono()

/**
 * CORS middleware configuration
 * Note: Adjust the origin, allowHeaders, and allowMethods as needed for your applicatio
 */
app.use(
  "/*",
  cors({
    origin: ["http://localhost:5173"],
    allowHeaders: ["Content-Type"],
    allowMethods: ["POST", "GET", "OPTIONS"],
  }),
)

app.route("/", rootApi).route("/invoke", invokeApi)

app
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

/**
 * Lambda entry point
 * Note: This will be used in the deployed Lambda environment
 */
// let handler: Handler

export const bufferedHandler: Handler = handle(app)

export const streamHandler: Handler = streamHandle(app)

/**
 * Local development entry point
 * Note: This will not be used in the deployed Lambda environment
 */
// if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
//   logger.info("Running in local development mode")
//   handler = handle(app)
//   serve(app, (info) => {
//     console.log(`Listening on http://localhost:${info.port}`)
//   })
// } else {
//   logger.info("Running in Lambda environment")
//   handler = streamHandle(app)
// }

// export { handler }
