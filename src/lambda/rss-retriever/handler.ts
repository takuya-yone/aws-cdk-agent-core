import { Tracer } from "@aws-lambda-powertools/tracer"
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware"
import middy from "@middy/core"
import Parser from "rss-parser"

import { ENV } from "./env"
import { parseFeedItems } from "./feed"
import { saveFeedItems } from "./repository"
import { logger } from "./utils"

const tracer = new Tracer({})
const parser = new Parser()

/**
 * RSS フィードを取得し、検証済みアイテムを DynamoDB に保存する。
 */
export const lambdaHandler = async () => {
  const feed = await parser.parseURL(ENV.FEED_URL)

  logger.info("Fetched feed items", { count: feed.items.length })

  const inputItems = parseFeedItems(feed.items)

  await saveFeedItems(inputItems)

  return "Success"
}

export const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer))
