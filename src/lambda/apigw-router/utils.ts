import { Logger } from "@aws-lambda-powertools/logger"
import type { APIGatewayProxyEvent } from "aws-lambda"
import { customAlphabet } from "nanoid"

export const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
)

export const logger = new Logger()

export const getActorIdFromEvent = (
  event: APIGatewayProxyEvent,
): string | undefined => {
  return (
    event?.requestContext?.authorizer?.claims.sub ?? `local-user-${nanoid(10)}`
  )
}
