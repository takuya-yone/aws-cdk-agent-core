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
  DUMMY_TABLE_NAME: getRequiredEnv("DUMMY_TABLE_NAME"),
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

type WhatsNewFeedItem = z.infer<typeof whatsNewFeedSchema>

const whatsNewFeedSchema = new dynamoose.Schema({
  userId: {
    type: String,
    hashKey: true, // パーティションキー
  },
  createdAt: {
    type: String,
    rangeKey: true, // ソートキー
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
})

const WhatsNewFeedModel = dynamoose.model(
  "WhatsNewFeedModel",
  whatsNewFeedSchema,
  {
    // tableName: ENV.WHATSNEW_FEED_TABLE,
    tableName: ENV.DUMMY_TABLE_NAME,
  },
)

const tracer = new Tracer({})
const logger = new Logger({})

const parser = new Parser()

export const lambdaHandler = async () => {
  const feed = await parser.parseURL(ENV.FEED_URL)
  const inputItems: WhatsNewFeedItem[] = []

  feed.items.forEach(async (item) => {
    const result = whatsNewFeedZodSchema.safeParse(item)
    if (result.success) {
      inputItems.push(result.data)

      const ts = new Date().toISOString()
      const newUser = new WhatsNewFeedModel({
        userId: `user_${Date.now()}`,
        createdAt: ts,
        name: ts,
        email: ts,
        age: 0,
      })
      const aaa = await newUser.save()
      console.log(aaa)

      // logger.info("Feed item already exists", { guid: result.data.guid, item: aaa })
    } else {
      logger.error(String(result.error))
    }
  })
  // await saveFeedItems(inputItems)
  return
}

export const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer))
