import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda"
import * as dynamoose from "dynamoose"

// ─── スキーマ定義 ───────────────────────────────────────────────
const userSchema = new dynamoose.Schema(
  {
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
  },
  // {
  //   timestamps: true, // createdAt / updatedAt を自動付与
  //   saveUnknown: false, // スキーマ外のフィールドを拒否
  // },
)

// ─── モデル定義 ─────────────────────────────────────────────────
// interface UserItem {
//   userId: string
//   createdAt: string
//   name: string
//   email: string
//   age?: number
//   isActive?: boolean
// }

const UserModel = dynamoose.model("Users", userSchema, {
  tableName: process.env.TABLE_NAME ?? "Users",
  create: false, // Lambda実行時にテーブルを自動作成しない
  waitForActive: false,
})

// ─── ローカル開発用設定（本番では不要） ─────────────────────────
if (process.env.IS_LOCAL === "true") {
  dynamoose.aws.ddb.local("http://localhost:8000")
}

// ─── ハンドラー ─────────────────────────────────────────────────
export const handler: Handler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> = async (event) => {
  try {
    const _body = JSON.parse(event.body ?? "{}")
    // const { userId, name, email, age } = body

    // if (!userId || !name || !email) {
    //   return response(400, { message: "userId, name, email は必須です" })
    // }

    // ── 1. 単一アイテムの保存（put / upsert）─────────────────
    const ts = new Date().toISOString()
    const newUser = new UserModel({
      userId: `user_${Date.now()}`,
      createdAt: ts,
      name: ts,
      email: ts,
      age: 0,
    })
    const saved = await newUser.save()

    // ── 2. 既存アイテムの部分更新 ────────────────────────────
    // await UserModel.update(
    //   { userId, createdAt: "2024-01-01T00:00:00.000Z" },
    //   { name: "新しい名前", age: 30 }
    // );

    // ── 3. バッチ書き込み ────────────────────────────────────
    // await UserModel.batchPut([
    //   { userId: "user_001", createdAt: new Date().toISOString(), name: "Alice", email: "alice@example.com" },
    //   { userId: "user_002", createdAt: new Date().toISOString(), name: "Bob",   email: "bob@example.com"   },
    // ]);

    // ── 4. 条件付き書き込み（属性が存在しない場合のみ保存）────
    // await UserModel.update(
    //   { userId, createdAt },
    //   { email },
    //   { condition: new dynamoose.Condition().attribute("userId").not().exists() }
    // );

    return response(201, { message: "保存しました", item: saved })
  } catch (err) {
    console.error("書き込みエラー:", err)
    return response(500, {
      message: "内部エラーが発生しました",
      error: String(err),
    })
  }
}

// ─── ユーティリティ ─────────────────────────────────────────────
function response(statusCode: number, body: object): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }
}

// import { Logger } from "@aws-lambda-powertools/logger"
// import { Tracer } from "@aws-lambda-powertools/tracer"
// import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware"
// import middy from "@middy/core"
// import * as dynamoose from "dynamoose"
// import Parser from "rss-parser"

// import { z } from "zod"

// const ddb = new dynamoose.aws.ddb.DynamoDB({
// 	"credentials": {
// 		"accessKeyId": "AKID",
// 		"secretAccessKey": "SECRET"
// 	},
// 	"region": "ap-northeast-1",
// });

// dynamoose.aws.ddb.set(ddb);

// const getRequiredEnv = (key: string): string => {
//   const value = process.env[key]
//   if (!value) {
//     throw new Error(`Missing required environment variable: ${key}`)
//   }
//   return value
// }

// const tracer = new Tracer({})
// const logger = new Logger({})

// const parser = new Parser()

// const ENV = {
//   FEED_URL: getRequiredEnv("FEED_URL"),
//   WHATSNEW_FEED_TABLE: getRequiredEnv("WHATSNEW_FEED_TABLE"),
// }

// const WhatsNewFeedSchema = z.object({
//   creator: z.string(),
//   title: z.string(),
//   link: z.url(),
//   author: z.string(),
//   content: z.string(),
//   contentSnippet: z.string(),
//   guid: z.string(),
//   categories: z.array(z.string()).length(1),
//   isoDate: z.iso.datetime(),
//   pubDate: z.string(),
// })

// type WhatsNewFeedItem = z.infer<typeof WhatsNewFeedSchema>

// const WhatsNewFeedModel = dynamoose.model(
//   "WhatsNewFeedModel",
//   {
//     YearMonth: {
//       type: String,
//       hashKey: true,
//     },
//     DateGuid: {
//       type: String,
//       rangeKey: true,
//     },
//     IsoDate: {
//       type: String,
//       required: true,
//     },
//     Title: {
//       type: String,
//       required: true,
//     },
//     Link: {
//       type: String,
//       required: true,
//     },
//     Author: {
//       type: String,
//       required: true,
//     },
//     Content: {
//       type: String,
//       required: true,
//     },
//     ContentSnippet: {
//       type: String,
//       required: true,
//     },
//     Guid: {
//       type: String,
//       required: true,
//     },
//     Categories: {
//       type: Array,
//       schema: [String],
//       required: true,
//     },
//     PubDate: {
//       type: String,
//       required: true,
//     },
//   },
//   { tableName: ENV.WHATSNEW_FEED_TABLE },
// )

// const saveFeedItems = async (items: WhatsNewFeedItem[]) => {
//   items.forEach(async (item) => {
//     const yearMonth = item.isoDate.substring(0, 7)
//     const dateGuid = `${item.isoDate}#${item.guid}`
//     const categories = item.categories[0]
//       .split(",")
//       .map((category) => category.trim())
//       .filter((category) => category.length > 0)

//     const record = new WhatsNewFeedModel({
//       YearMonth: yearMonth,
//       DateGuid: dateGuid,
//       IsoDate: item.isoDate,
//       Title: item.title,
//       Link: item.link,
//       Author: item.author,
//       Content: item.content,
//       ContentSnippet: item.contentSnippet,
//       Guid: item.guid,
//       Categories: categories,
//       PubDate: item.pubDate,
//     })
//     try {
//       const aaa = await WhatsNewFeedModel.scan().exec();
//       console.log(aaa)
//       await record.save()
//       console.log("Feed item saved", { guid: item.guid })
//       const allBooks = await WhatsNewFeedModel.scan().exec();
//       console.log(allBooks)
//     } catch (err) {
//       logger.error("Error saving feed item", { error: err, guid: item.guid })
//     }
//   })
// }

// export const lambdaHandler = async () => {
//   const feed = await parser.parseURL(ENV.FEED_URL)
//   const inputItems: WhatsNewFeedItem[] = []

//   feed.items.forEach(async (item) => {
//     const result = WhatsNewFeedSchema.safeParse(item)
//     if (result.success) {
//       inputItems.push(result.data)
//       const aaa = await WhatsNewFeedModel.get({
//         YearMonth: result.data.isoDate.substring(0, 7),
//         DateGuid: `${result.data.isoDate}#${result.data.guid}`,
//       })
//       logger.info("Feed item already exists", { guid: result.data.guid, item: aaa })
//     } else {
//       logger.error(String(result.error))
//     }
//   })
//   await saveFeedItems(inputItems)
//   return
// }

// export const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer))
