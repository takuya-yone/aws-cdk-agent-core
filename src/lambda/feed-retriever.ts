import { Logger } from "@aws-lambda-powertools/logger"
import { Tracer } from "@aws-lambda-powertools/tracer"
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

const _tracer = new Tracer({})
const logger = new Logger({})

const parser = new Parser()

const ENV = {
  FEED_URL: getRequiredEnv("FEED_URL"),
  WHATSNEW_FEED_TABLE: getRequiredEnv("WHATSNEW_FEED_TABLE"),
}

const WhatsNewFeedSchema = z.object({
  creator: z.string(),
  title: z.string(),
  link: z.url(),
  author: z.string(),
  content: z.string(),
  contentSnippet: z.string(),
  guid: z.string(),
  categories: z.array(z.string()),
  isoDate: z.iso.datetime(),
  pubDate: z.string(),
})

type WhatsNewFeedItem = z.infer<typeof WhatsNewFeedSchema>

export const WhatsNewFeedModel = dynamoose.model(
  "WhatsNewFeedModel",
  {
    YearMonth: {
      type: String,
      hashKey: true,
    },
    IsoDate: {
      type: String,
      rangeKey: true,
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
    Guid: {
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
  },
  { tableName: ENV.WHATSNEW_FEED_TABLE },
)

export const saveFeedItem = async (item: WhatsNewFeedItem) => {
  const feedItem = new WhatsNewFeedModel({
    YearMonth: item.isoDate.substring(0, 7),
    IsoDate: item.isoDate,
    Title: item.title,
    Link: item.link,
    Author: item.author,
    Content: item.content,
    ContentSnippet: item.contentSnippet,
    Guid: item.guid,
    Categories: item.categories,
    PubDate: item.pubDate,
  })
  await feedItem.save()
}

export const handler = async () => {
  const feed = await parser.parseURL(ENV.FEED_URL)

  feed.items.forEach((item) => {
    const result = WhatsNewFeedSchema.safeParse(item)
    if (result.success) {
      saveFeedItem(result.data)
    } else {
      logger.error(String(result.error))
    }
  })
  return
}
