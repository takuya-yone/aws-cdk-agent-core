// import { streamHandle } from 'hono/aws-lambda'
// import { streamText } from 'hono/streaming'
import { Logger } from "@aws-lambda-powertools/logger"
import { serve } from "@hono/node-server"
import { Hono } from "hono"
import type { LambdaEvent } from "hono/aws-lambda"
import { type ApiGatewayRequestContext, handle } from "hono/aws-lambda"

type Bindings = {
  event: LambdaEvent
  context: ApiGatewayRequestContext
}

const app = new Hono<{ Bindings: Bindings }>()

const _logger = new Logger()

app.get("/", (c) => {
  // logger.info(c)
  //   console.log(c.env.event.requestContext)
  return c.text("Hello Hono!")
})

app.get("/aaa", (c) => {
  console.log(c)
  //   console.log(c.env.context.authorizer.claims)
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

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`) // Listening on http://localhost:3000
})
