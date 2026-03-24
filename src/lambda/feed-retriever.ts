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

const tracer = new Tracer({})
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
  categories: z.array(z.string()).length(1),
  isoDate: z.iso.datetime(),
  pubDate: z.string(),
})

type WhatsNewFeedItem = z.infer<typeof WhatsNewFeedSchema>

const WhatsNewFeedModel = dynamoose.model(
  "WhatsNewFeedModel",
  {
    YearMonth: {
      type: String,
      hashKey: true,
    },
    DateGuid: {
      type: String,
      rangeKey: true,
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

const saveFeedItems = async (items: WhatsNewFeedItem[]) => {
  items.forEach((item) => {
    const yearMonth = item.isoDate.substring(0, 7)
    const dateGuid = `${item.isoDate}#${item.guid}`
    const categories = item.categories[0]
      .split(",")
      .map((category) => category.trim())
      .filter((category) => category.length > 0)

    const record = new WhatsNewFeedModel({
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
    })

    try {
      record.save()
    } catch (err) {
      logger.error("Error saving feed item", { error: err, guid: item.guid })
    }
  })
}

export const lambdaHandler = async () => {
  const feed = await parser.parseURL(ENV.FEED_URL)
  const inputItems: WhatsNewFeedItem[] = []

  feed.items.forEach(async (item) => {
    const result = WhatsNewFeedSchema.safeParse(item)
    if (result.success) {
      inputItems.push(result.data)
    } else {
      logger.error(String(result.error))
    }
  })
  await saveFeedItems(inputItems)
}

export const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer))
