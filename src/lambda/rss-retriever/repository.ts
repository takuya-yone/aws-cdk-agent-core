import { convertToDynamoDBItem } from "./feed"
import { type WhatsNewFeedItem, WhatsNewFeedModel } from "./schema"
import { DYNAMODB_BATCH_SIZE, logger } from "./utils"

/**
 * フィードアイテムを DynamoDB に保存する。
 * BatchWriteItem の上限 (25 アイテム) に合わせて分割して書き込む。
 */
export const saveFeedItems = async (items: WhatsNewFeedItem[]) => {
  const dynamoDBItems = items.map(convertToDynamoDBItem)

  for (let i = 0; i < dynamoDBItems.length; i += DYNAMODB_BATCH_SIZE) {
    const batch = dynamoDBItems.slice(i, i + DYNAMODB_BATCH_SIZE)
    try {
      await WhatsNewFeedModel.batchPut(batch)
      logger.info("Batch put successful", { count: batch.length })
    } catch (err) {
      logger.error("Batch put failed", { error: err })
      throw err
    }
  }
}
