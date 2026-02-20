import { serve } from "@hono/node-server"
import { swaggerUI } from "@hono/swagger-ui"
import { OpenAPIHono } from "@hono/zod-openapi"
import { cors } from "hono/cors"
import { historyApi } from "./route/history-api"
import { invokeApi } from "./route/invoke-api"
import { rootApi } from "./route/root-api"
import { logger } from "./utils"

const app = new OpenAPIHono().basePath("/api")

/**
 * CORS middleware configuration
 * Note: Adjust the origin, allowHeaders, and allowMethods as needed for your applicatio
 */
app.use(
  "/*",
  cors({
    origin: ["*"],
    allowHeaders: ["Content-Type"],
    allowMethods: ["*"],
  }),
)

app
  .route("/", rootApi)
  .route("/invoke", invokeApi)
  .route("/history", historyApi)

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
      url: "/api/specification",
    }),
  )

app.onError((err, c) => {
  logger.error("Unhandled error", { error: err.message, stack: err.stack })
  return c.json({ message: "Internal Server Error", details: err.message }, 500)
})

/**
 * Local development entry point
 * Note: This will not be used in the deployed Lambda environment
 */
logger.info("Running in local development mode")
serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`)
})
