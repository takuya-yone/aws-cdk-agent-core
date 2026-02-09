import { Logger } from "@aws-lambda-powertools/logger"
import { Tracer } from "@aws-lambda-powertools/tracer"
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware"
import middy from "@middy/core"
import type { APIGatewayProxyEvent, Context } from "aws-lambda"

const tracer = new Tracer({})
const logger = new Logger({})

const lambdaHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context,
) => {
  logger.info("Received event", { event })
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello World",
    }),
  }
}

export const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer))
