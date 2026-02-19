import { Logger } from "@aws-lambda-powertools/logger"
import { customAlphabet } from "nanoid"

export const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
)

export const logger = new Logger()
