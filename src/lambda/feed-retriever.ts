import { Logger } from "@aws-lambda-powertools/logger"
import { Tracer } from "@aws-lambda-powertools/tracer"
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware"
import middy from "@middy/core"
import * as dynamoose from "dynamoose"
import Parser from "rss-parser"

import { z } from "zod"

const getRequiredEnv = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

const ENV = {
  FEED_URL: getRequiredEnv("FEED_URL"),
  WHATSNEW_FEED_TABLE: getRequiredEnv("WHATSNEW_FEED_TABLE"),
}

const whatsNewFeedZodSchema = z.object({
  creator: z.string(),
  title: z.string(),
  link: z.url(),
  author: z.string(),
  content: z.string(),
  contentSnippet: z.string(),
  guid: z.string(),
  categories: z.array(z.string()).length(1),
  isoDate: z.iso.datetime(),
  pubDate: z.string(),
})

type WhatsNewFeedItem = z.infer<typeof whatsNewFeedZodSchema>

const whatsNewFeedSchema = new dynamoose.Schema({
  Guid: {
    type: String,
    hashKey: true,
  },
  YearMonth: {
    type: String,
    required: true,
  },
  IsoDate: {
    type: String,
    required: true,
  },
  Title: {
    type: String,
    required: true,
  },
  Link: {
    type: String,
    required: true,
  },
  Author: {
    type: String,
    required: true,
  },
  Content: {
    type: String,
    required: true,
  },
  ContentSnippet: {
    type: String,
    required: true,
  },
  Categories: {
    type: Array,
    schema: [String],
    required: true,
  },
  PubDate: {
    type: String,
    required: true,
  },
})

const WhatsNewFeedModel = dynamoose.model(
  "WhatsNewFeedModel",
  whatsNewFeedSchema,
  {
    tableName: ENV.WHATSNEW_FEED_TABLE,
  },
)

const convertToDynamoDBItem = (item: WhatsNewFeedItem) => {
  const yearMonth = item.isoDate.substring(0, 7)
  const date = item.isoDate.substring(0, 10)
  const dateGuid = `${date}#${item.guid}`
  const categories = item.categories[0]
    .split(",")
    .map((category) => category.trim())
    .filter((category) => category.length > 0)

  return {
    YearMonth: yearMonth,
    DateGuid: dateGuid,
    IsoDate: item.isoDate,
    Title: item.title,
    Link: item.link,
    Author: item.author,
    Content: item.content,
    ContentSnippet: item.contentSnippet,
    Guid: item.guid,
    Categories: categories,
    PubDate: item.pubDate,
  }
}

const saveFeedItems = async (items: WhatsNewFeedItem[]) => {
  const dynamoDBItems = items.map(convertToDynamoDBItem)
  // DynamoDBのBatchWriteItemは最大25アイテムまでなので、25アイテムずつに分割して保存する
  for (let i = 0; i < dynamoDBItems.length; i += 25) {
    const batch = dynamoDBItems.slice(i, i + 25)
    try {
      await WhatsNewFeedModel.batchPut(batch)
      logger.info("Batch put successful", { count: batch.length })
    } catch (err) {
      logger.error("Batch put failed", { error: err })
    }
  }
}

const parseFeedItems = (items: Parser.Item[]): WhatsNewFeedItem[] => {
  const validItems: WhatsNewFeedItem[] = []
  for (const item of items) {
    const result = whatsNewFeedZodSchema.safeParse(item)
    if (result.success) {
      validItems.push(result.data)
    } else {
      logger.error("Invalid feed item", {
        error: String(result.error),
        guid: item.guid,
      })
    }
  }
  return validItems
}

const tracer = new Tracer({})
const logger = new Logger({})

const parser = new Parser()

export const lambdaHandler = async () => {
  const feed = await parser.parseURL(ENV.FEED_URL)

  logger.info("Fetched feed items", { count: feed.items.length })

  const inputItems: WhatsNewFeedItem[] = parseFeedItems(feed.items)

  await saveFeedItems(inputItems)

  return
}

export const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer))
