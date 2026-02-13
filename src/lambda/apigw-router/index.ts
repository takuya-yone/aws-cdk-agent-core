// import { streamHandle } from 'hono/aws-lambda'
// import { streamText } from 'hono/streaming'
import { Logger } from "@aws-lambda-powertools/logger"
import { Hono } from "hono"
import { handle } from "hono/aws-lambda"

const app = new Hono()

const _logger = new Logger()

app.get("/", (c) => {
  // logger.info(c)
  console.log(c)
  return c.text("Hello Hono!")
})

app.get("/aaa", (c) => {
  console.log(c)
  // logger.info(c)
  return c.text("Hello Hono!aaa")
})

// app.get('/stream', async (c) => {
//   return streamText(c, async (stream) => {
//     for (let i = 0; i < 3; i++) {
//       await stream.writeln(`${i}`)
//       await stream.sleep(1)
//     }
//   })
// })

export const handler = handle(app)
// export const handler = streamHandle(app)
