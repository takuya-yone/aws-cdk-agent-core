import type Parser from "rss-parser"

import { type WhatsNewFeedItem, whatsNewFeedZodSchema } from "./schema"
import { logger } from "./utils"

/**
 * rss-parser のアイテム配列を検証し、スキーマに適合するものだけを返す。
 * 不正なアイテムはスキップしてログに記録する。
 */
export const parseFeedItems = (items: Parser.Item[]): WhatsNewFeedItem[] => {
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

/** フィードアイテムを DynamoDB の保存形式へ変換する。 */
export const convertToDynamoDBItem = (item: WhatsNewFeedItem) => {
  const yearMonth = item.isoDate.substring(0, 7)
  const categories = item.categories[0]
    .split(",")
    .map((category) => category.trim())
    .filter((category) => category.length > 0)

  return {
    YearMonth: yearMonth,
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
