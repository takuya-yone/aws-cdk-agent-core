import * as dynamoose from "dynamoose"
import { z } from "zod"

import { ENV } from "./env"

/**
 * AWS What's New フィードの 1 アイテムを表す Zod スキーマ。
 * rss-parser が返す要素を検証・整形するために利用する。
 */
export const whatsNewFeedZodSchema = z.object({
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

export type WhatsNewFeedItem = z.infer<typeof whatsNewFeedZodSchema>

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

export const WhatsNewFeedModel = dynamoose.model(
  "WhatsNewFeedModel",
  whatsNewFeedSchema,
  {
    tableName: ENV.WHATSNEW_FEED_TABLE,
  },
)
