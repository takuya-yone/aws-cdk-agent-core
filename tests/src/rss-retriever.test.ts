import type Parser from "rss-parser"
import { describe, expect, it } from "vitest"

import {
  convertToDynamoDBItem,
  parseFeedItems,
} from "../../src/lambda/rss-retriever/feed"
import type { WhatsNewFeedItem } from "../../src/lambda/rss-retriever/schema"

/** テスト用の有効なフィードアイテムを生成する。 */
const createValidItem = (overrides: Partial<Parser.Item> = {}): Parser.Item =>
  ({
    title: "New feature launched",
    link: "https://aws.amazon.com/about-aws/whats-new/2024/01/example/",
    author: "Amazon Web Services",
    content: "<p>Full content</p>",
    contentSnippet: "Full content",
    guid: "https://aws.amazon.com/about-aws/whats-new/2024/01/example/",
    categories: ["general:products/amazon-ec2,general:products/aws-lambda"],
    isoDate: "2024-01-15T18:30:00.000Z",
    pubDate: "Mon, 15 Jan 2024 18:30:00 +0000",
    ...overrides,
  }) as Parser.Item

describe("parseFeedItems", () => {
  it("returns items that match the schema", () => {
    const items = [createValidItem(), createValidItem({ guid: "guid-2" })]

    const result = parseFeedItems(items)

    expect(result).toHaveLength(2)
    expect(result[0].title).toBe("New feature launched")
  })

  it("skips items that fail schema validation", () => {
    const invalidItem = createValidItem({ link: "not-a-url" })
    const items = [createValidItem(), invalidItem]

    const result = parseFeedItems(items)

    expect(result).toHaveLength(1)
    expect(result[0].link).toBe(
      "https://aws.amazon.com/about-aws/whats-new/2024/01/example/",
    )
  })

  it("returns an empty array when no items are valid", () => {
    const result = parseFeedItems([createValidItem({ categories: [] })])

    expect(result).toEqual([])
  })
})

describe("convertToDynamoDBItem", () => {
  const baseItem: WhatsNewFeedItem = {
    title: "New feature launched",
    link: "https://aws.amazon.com/about-aws/whats-new/2024/01/example/",
    author: "Amazon Web Services",
    content: "<p>Full content</p>",
    contentSnippet: "Full content",
    guid: "guid-1",
    categories: ["general:products/amazon-ec2, general:products/aws-lambda"],
    isoDate: "2024-01-15T18:30:00.000Z",
    pubDate: "Mon, 15 Jan 2024 18:30:00 +0000",
  }

  it("derives YearMonth from the ISO date", () => {
    const result = convertToDynamoDBItem(baseItem)

    expect(result.YearMonth).toBe("2024-01")
  })

  it("splits and trims comma-separated categories", () => {
    const result = convertToDynamoDBItem(baseItem)

    expect(result.Categories).toEqual([
      "general:products/amazon-ec2",
      "general:products/aws-lambda",
    ])
  })

  it("drops empty category segments", () => {
    const result = convertToDynamoDBItem({
      ...baseItem,
      categories: ["general:products/amazon-ec2, ,"],
    })

    expect(result.Categories).toEqual(["general:products/amazon-ec2"])
  })

  it("maps the remaining fields onto the DynamoDB shape", () => {
    const result = convertToDynamoDBItem(baseItem)

    expect(result).toMatchObject({
      Guid: "guid-1",
      Title: "New feature launched",
      Link: "https://aws.amazon.com/about-aws/whats-new/2024/01/example/",
      Author: "Amazon Web Services",
      Content: "<p>Full content</p>",
      ContentSnippet: "Full content",
      IsoDate: "2024-01-15T18:30:00.000Z",
      PubDate: "Mon, 15 Jan 2024 18:30:00 +0000",
    })
  })
})
