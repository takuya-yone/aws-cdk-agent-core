import { serve } from "@hono/node-server"
import { app } from "./app"
import { logger } from "./utils"

/**
 * Local development entry point
 * Note: This will not be used in the deployed Lambda environment
 */
logger.info("Running in local development mode")
serve(app, (info) => {
  logger.info(`Listening on http://localhost:${info.port}`)
})
