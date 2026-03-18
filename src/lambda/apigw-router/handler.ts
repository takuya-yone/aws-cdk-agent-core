import type { Handler } from "aws-lambda"
import { handle, streamHandle } from "hono/aws-lambda"
import { app } from "./app"

/**
 * Lambda entry point
 * Note: This will be used in the deployed Lambda environment
 */
const handler: Handler = handle(app)
const streamHandler: Handler = streamHandle(app)

export { handler, streamHandler }
