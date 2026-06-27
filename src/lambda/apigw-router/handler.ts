import type { Handler } from "aws-lambda"
import { handle, streamHandle } from "hono/aws-lambda"

import { app } from "./app"

/**
 * Lambda entry point for  buffered
 */
const handler: Handler = handle(app)

/**
 * Lambda entry point for streaming
 */
const streamHandler: Handler = streamHandle(app)

export { handler, streamHandler }
