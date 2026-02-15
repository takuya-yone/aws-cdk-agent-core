import { Logger } from "@aws-lambda-powertools/logger"
import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore"
import type { RouteHandler } from "@hono/zod-openapi"
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import type { APIGatewayProxyEvent } from "aws-lambda"
import type { SSEStreamingApi } from "hono/streaming"
import { streamSSE } from "hono/streaming"

export const inputSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
})

/**
 * @see - https://docs.aws.amazon.com/ja_jp/bedrock/latest/userguide/conversation-inference-call.html#conversation-inference-call-response
 */
const outputSchema = z.object({
  event: z.enum([
    "messageStart",
    "contentBlockStart",
    "contentBlockDelta",
    "contentBlockStop",
    "messageStop",
    "metadata",
  ]),
  data: z.string(),
})

// const _MessageStartEventSchema = z.object({
//   messageStart: z.object({
//     role: z.enum(["user", "assistant"]),
//   }),
// })

// const ImageBlockStartSchema = z.object({
//   format: z.enum(["png", "jpeg", "gif", "webp"]),
// })
// const ToolResultBlockStartSchema = z.object({
//   toolUseId: z.string(),
//   status: z.enum(["success", "error"]).optional(),
//   type: z.string().optional(),
// })
// const ToolUseBlockStartSchema = z.object({
//   name: z.string(),
//   toolUseId: z.string(),
//   type: z.string().optional(),
// })

// const ContentBlockStartSchema = z.object({
//   image: ImageBlockStartSchema.optional(),
//   toolResult: ToolResultBlockStartSchema.optional(),
//   toolUse: ToolUseBlockStartSchema.optional(),
// })

// const _ContentBlockStartEventSchema = z.object({
//   contentBlockStart: z.object({
//     contentBlockIndex: z.number(),
//     start: ContentBlockStartSchema,
//   }),
// })

// const DocumentCharLocationSchema = z.object({
//   documentIndex: z.number().optional(),
//   end: z.number().optional(),
//   start: z.number().optional(),
// })

// const DocumentChunkLocationSchema = z.object({
//   documentIndex: z.number().optional(),
//   end: z.number().optional(),
//   start: z.number().optional(),
// })

// const DocumentPageLocationSchema = z.object({
//   documentIndex: z.number().optional(),
//   end: z.number().optional(),
//   start: z.number().optional(),
// })

// const SearchResultLocationSchema = z.object({
//   end: z.number().optional(),
//   searchResultIndex: z.number().optional(),
//   start: z.number().optional(),
// })

// const WebLocationSchema = z.object({
//   domain: z.string().optional(),
//   url: z.string().optional(),
// })

// const CitationLocationSchema = z.object({
//   documentChar: DocumentCharLocationSchema.optional(),
//   documentChunk: DocumentChunkLocationSchema.optional(),
//   documentPage: DocumentPageLocationSchema.optional(),
//   searchResult: SearchResultLocationSchema.optional(),
//   web: WebLocationSchema.optional(),
// })

// const CitationSourceContentDeltaSchema = z.object({
//   text: z.string().optional(),
// })

// const CitationsDeltaSchema = z.object({
//   location: CitationLocationSchema.optional(),
//   source: z.string().optional(),
//   sourceContent: z.array(CitationSourceContentDeltaSchema).optional(),
//   title: z.string().optional(),
// })

// const ErrorBlockSchema = z.object({
//   message: z.string().optional(),
// })

// const S3LocationSchema = z.object({
//   uri: z.string(),
//   bucketOwner: z.string().optional(),
// })

// const ImageSourceSchema = z.object({
//   bytes: z.base64().optional(),
//   s3Location: S3LocationSchema.optional(),
// })

// const ImageBlockDeltaSchema = z.object({
//   error: ErrorBlockSchema.optional(),
//   source: ImageSourceSchema.optional(),
// })

// // const ImageBlockDeltaSchema = z.object({
// //   bytes:z.base64().optional(),
// //   s3Location:S3LocationSchema.optional()
// // })

// const ReasoningContentBlockDeltaSchema = z.object({
//   redactedContent: z.base64().optional(),
//   signature: z.string().optional(),
//   text: z.string().optional(),
// })

// const ToolResultBlockDeltaSchema = z.object({
//   json: z.object({}).optional(),
//   text: z.string().optional(),
// })

// const ToolUseBlockDeltaSchema = z.object({
//   input: z.string(),
// })

// const ContentBlockDeltaSchema = z.object({
//   citation: CitationsDeltaSchema.optional(),
//   image: ImageBlockDeltaSchema.optional(),
//   reasoningContent: ReasoningContentBlockDeltaSchema.optional(),
//   text: z.string().optional(),
//   toolResult: ToolResultBlockDeltaSchema.optional(),
//   toolUse: ToolUseBlockDeltaSchema.optional(),
// })

// const ContentBlockDeltaEventSchema = z.object({
//   contentBlockDelta: z.object({
//     contentBlockIndex: z.number(),
//     delta: ContentBlockDeltaSchema
//   }),
// })

// const ContentBlockStopEventSchema = z.object({
//   contentBlockStop: z.object({
//     contentBlockIndex: z.number(),
//   }),
// })

// const MessageStopEventSchema = z.object({
//   messageStop: z.object({
//     stopReason: z.enum([
//       "end_turn",
//       "tool_use",
//       "max_tokens",
//       "stop_sequence",
//       "guardrail_intervened",
//       "content_filtered",
//       "malformed_model_output",
//       "malformed_tool_use",
//       "model_context_window_exceeded",
//     ]),
//   }),
//   additionalModelResponseFields: z.object({}).optional(),
// })

// const ConverseStreamMetricsSchema = z.object({
//   latencyMs: z.bigint()
// })

// const CacheDetailSchema = z.object({
//   inputTokens: z.number(),
//   ttl:z.enum(["5m","1h"])})

// const TokenUsageSchema = z.object({
//   inputTokens: z.number(),
//   outputTokens: z.number(),
//   totalTokens: z.number(),
//   cacheDetails: CacheDetailSchema.optional(),
//   cacheReadInputTokens: z.number().optional(),
//   cacheWriteInputTokens : z.number().optional(),
// })

// const PerformanceConfigurationSchema = z.object({
//   latency:z.enum(["standard","optimized"])
// })

// const ServiceTierSchema = z.enum(["priority", "default", "flex", "reserved"])

// const GuardrailTraceAssessmentSchema = z.object({
//   actionReason:z.string().optional(),
//   inputAssessment:
//   modelOutput:
//   outputAssessments:
// })

// const PromptRouterTraceSchema = z.object({
//   invokedModelId:z.string().optional(),
// })

// const ConverseStreamTraceSchema = z.object({
//   guardrail:GuardrailTraceAssessmentSchema.optional(),
//   promptRouter:PromptRouterTraceSchema.optional(),
// })

// const MetadataSchema = z.object({
//   metadata: z.object({
//     metrics:ConverseStreamMetricsSchema,
//     usage:TokenUsageSchema,
//     performanceConfig:PerformanceConfigurationSchema.optional(),
//     serviceTier:ServiceTierSchema.optional(),
//     trace:ConverseStreamTraceSchema.optional()
//   }),
// })

type Bindings = {
  event: APIGatewayProxyEvent
}

export const invokeRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: inputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successful response with SSE stream",
      content: {
        "text/event-stream": {
          schema: outputSchema,
        },
      },
    },
  },
})

const AGENT_RUNTIME_ARN = process.env.AGENT_RUNTIME_ARN
if (!AGENT_RUNTIME_ARN) {
  throw new Error("AGENT_RUNTIME_ARN is not defined")
}

const invokeCommandFactory = ({
  prompt,
  actorId,
  sessionId,
  traceId,
}: {
  prompt: string
  actorId?: string
  sessionId?: string
  traceId?: string
}) =>
  new InvokeAgentRuntimeCommand({
    agentRuntimeArn: AGENT_RUNTIME_ARN,
    payload: new TextEncoder().encode(
      JSON.stringify({
        prompt: prompt,
        actor_id: actorId,
        session_id: sessionId,
      }),
    ),
    qualifier: "DEFAULT",
    traceId: traceId,
  })

const logger = new Logger()

const agentCoreClient = new BedrockAgentCoreClient({})

const invokeRouteHandler: RouteHandler<
  typeof invokeRoute,
  { Bindings: Bindings }
> = async (c) => {
  const { prompt } = c.req.valid("json")

  const event = c.env.event

  const actorId: string | undefined = event
    ? event.requestContext.authorizer?.claims.sub
    : "local-useraaaa"

  const sessionId = `${actorId}-default`

  logger.info("invoke request inputs", { prompt, actorId, sessionId })

  const invokeCommand = invokeCommandFactory({
    prompt: prompt,
    actorId: actorId,
    sessionId: sessionId,
  })

  const runtimeResponse = await agentCoreClient.send(invokeCommand)

  if (!runtimeResponse.response) {
    logger.error("No response received from agent runtime", { runtimeResponse })
    return c.json({ message: "No response received from agent runtime" }, 500)
  }

  const responseStream = runtimeResponse.response
    .transformToWebStream()
    .pipeThrough(new TextDecoderStream())
  const responseReader = responseStream.getReader()

  const responseSse = async (
    stream: SSEStreamingApi,
    reader: ReadableStreamDefaultReader<string>,
  ) => {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      const lines = value.split("\n")
      for (const line of lines) {
        if (line) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6))
            const eventKey = Object.keys(data.event)[0]
            const eventData = data.event
            console.log(eventData)
            await stream.writeSSE({
              data: JSON.stringify(eventData[eventKey]),
              event: eventKey,
            })
          }
        }
      }
    }
  }

  return streamSSE(c, async (stream) => {
    await responseSse(stream, responseReader)
  })
}

export const invokeApi = new OpenAPIHono<{ Bindings: Bindings }>().openapi(
  invokeRoute,
  invokeRouteHandler,
)
