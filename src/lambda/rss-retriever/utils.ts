import { Logger } from "@aws-lambda-powertools/logger"

export const logger = new Logger({})

/** DynamoDB の BatchWriteItem は 1 リクエストあたり最大 25 アイテム。 */
export const DYNAMODB_BATCH_SIZE = 25
