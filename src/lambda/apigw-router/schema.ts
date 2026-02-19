import { z } from "@hono/zod-openapi"
import * as dynamoose from "dynamoose"

export const InputSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  sessionId: z.string().optional(),
})

export const EventTypeSchema = z.enum([
  "messageStart",
  "contentBlockStart",
  "contentBlockDelta",
  "contentBlockStop",
  "messageStop",
  "metadata",
])

const MessageStartEventSchema = z.object({
  messageStart: z.object({
    role: z.enum(["user", "assistant"]),
  }),
})

const ImageBlockStartSchema = z.object({
  format: z.enum(["png", "jpeg", "gif", "webp"]),
})
const ToolResultBlockStartSchema = z.object({
  toolUseId: z.string(),
  status: z.enum(["success", "error"]).optional(),
  type: z.string().optional(),
})
const ToolUseBlockStartSchema = z.object({
  name: z.string(),
  toolUseId: z.string(),
  type: z.string().optional(),
})

const ContentBlockStartSchema = z.object({
  image: ImageBlockStartSchema.optional(),
  toolResult: ToolResultBlockStartSchema.optional(),
  toolUse: ToolUseBlockStartSchema.optional(),
})

const ContentBlockStartEventSchema = z.object({
  contentBlockStart: z.object({
    contentBlockIndex: z.number(),
    start: ContentBlockStartSchema,
  }),
})

const DocumentCharLocationSchema = z.object({
  documentIndex: z.number().optional(),
  end: z.number().optional(),
  start: z.number().optional(),
})

const DocumentChunkLocationSchema = z.object({
  documentIndex: z.number().optional(),
  end: z.number().optional(),
  start: z.number().optional(),
})

const DocumentPageLocationSchema = z.object({
  documentIndex: z.number().optional(),
  end: z.number().optional(),
  start: z.number().optional(),
})

const SearchResultLocationSchema = z.object({
  end: z.number().optional(),
  searchResultIndex: z.number().optional(),
  start: z.number().optional(),
})

const WebLocationSchema = z.object({
  domain: z.string().optional(),
  url: z.string().optional(),
})

const CitationLocationSchema = z.object({
  documentChar: DocumentCharLocationSchema.optional(),
  documentChunk: DocumentChunkLocationSchema.optional(),
  documentPage: DocumentPageLocationSchema.optional(),
  searchResult: SearchResultLocationSchema.optional(),
  web: WebLocationSchema.optional(),
})

const CitationSourceContentDeltaSchema = z.object({
  text: z.string().optional(),
})

const CitationsDeltaSchema = z.object({
  location: CitationLocationSchema.optional(),
  source: z.string().optional(),
  sourceContent: z.array(CitationSourceContentDeltaSchema).optional(),
  title: z.string().optional(),
})

const ErrorBlockSchema = z.object({
  message: z.string().optional(),
})

const S3LocationSchema = z.object({
  uri: z.string(),
  bucketOwner: z.string().optional(),
})

const ImageSourceSchema = z.object({
  bytes: z.base64().optional(),
  s3Location: S3LocationSchema.optional(),
})

const ImageBlockDeltaSchema = z.object({
  error: ErrorBlockSchema.optional(),
  source: ImageSourceSchema.optional(),
})

const ReasoningContentBlockDeltaSchema = z.object({
  redactedContent: z.base64().optional(),
  signature: z.string().optional(),
  text: z.string().optional(),
})

const ToolResultBlockDeltaSchema = z.object({
  json: z.object({}).optional(),
  text: z.string().optional(),
})

const ToolUseBlockDeltaSchema = z.object({
  input: z.string(),
})

const ContentBlockDeltaSchema = z.object({
  citation: CitationsDeltaSchema.optional(),
  image: ImageBlockDeltaSchema.optional(),
  reasoningContent: ReasoningContentBlockDeltaSchema.optional(),
  text: z.string().optional(),
  toolResult: ToolResultBlockDeltaSchema.optional(),
  toolUse: ToolUseBlockDeltaSchema.optional(),
})

const ContentBlockDeltaEventSchema = z.object({
  contentBlockDelta: z.object({
    contentBlockIndex: z.number(),
    delta: ContentBlockDeltaSchema,
  }),
})

const ContentBlockStopEventSchema = z.object({
  contentBlockStop: z.object({
    contentBlockIndex: z.number(),
  }),
})

const MessageStopEventSchema = z.object({
  messageStop: z.object({
    stopReason: z.enum([
      "end_turn",
      "tool_use",
      "max_tokens",
      "stop_sequence",
      "guardrail_intervened",
      "content_filtered",
      "malformed_model_output",
      "malformed_tool_use",
      "model_context_window_exceeded",
    ]),
    additionalModelResponseFields: z.object({}).optional(),
  }),
})

const ConverseStreamMetricsSchema = z.object({
  latencyMs: z.number(),
})

const CacheDetailSchema = z.object({
  inputTokens: z.number(),
  ttl: z.enum(["5m", "1h"]),
})

const TokenUsageSchema = z.object({
  inputTokens: z.number(),
  outputTokens: z.number(),
  totalTokens: z.number(),
  cacheDetails: CacheDetailSchema.optional(),
  cacheReadInputTokens: z.number().optional(),
  cacheWriteInputTokens: z.number().optional(),
})

const PerformanceConfigurationSchema = z.object({
  latency: z.enum(["standard", "optimized"]),
})

const ServiceTierSchema = z.enum(["priority", "default", "flex", "reserved"])

// TODO define the schema for guardrail assessment, including fields such as assessment type, result, and any relevant details or metadata.
const GuardrailAssessmentSchema = z.object({})

const GuardrailTraceAssessmentSchema = z.object({
  actionReason: z.string().optional(),
  inputAssessment: GuardrailAssessmentSchema.optional(),
  modelOutput: z.array(z.string()),
  outputAssessments: GuardrailAssessmentSchema.optional(),
})

const PromptRouterTraceSchema = z.object({
  invokedModelId: z.string().optional(),
})

const ConverseStreamTraceSchema = z.object({
  guardrail: GuardrailTraceAssessmentSchema.optional(),
  promptRouter: PromptRouterTraceSchema.optional(),
})

const MetadataSchema = z.object({
  metadata: z.object({
    metrics: ConverseStreamMetricsSchema,
    usage: TokenUsageSchema,
    performanceConfig: PerformanceConfigurationSchema.optional(),
    serviceTier: ServiceTierSchema.optional(),
    trace: ConverseStreamTraceSchema.optional(),
  }),
})

/**
 * @see - https://docs.aws.amazon.com/ja_jp/bedrock/latest/userguide/conversation-inference-call.html#conversation-inference-call-response
 */
export const OutputSchema = MessageStartEventSchema.or(
  ContentBlockStartEventSchema,
)
  .or(ContentBlockDeltaEventSchema)
  .or(ContentBlockStopEventSchema)
  .or(MessageStopEventSchema)
  .or(MetadataSchema)

/**
 * Dynamoose model for logging conversation events. Each log entry includes details about the invocation, actor, session, input, and output of a conversation event.
 */
const AGENTCORE_LOG_TABLE_NAME = process.env.AGENTCORE_LOG_TABLE_NAME
if (!AGENTCORE_LOG_TABLE_NAME) {
  throw new Error("AGENTCORE_LOG_TABLE_NAME is not defined")
}

export const LogModel = dynamoose.model(
  "LogModel",
  {
    InvocationId: {
      type: String,
      required: true,
    },
    ActorId: {
      type: String,
      hashKey: true,
    },
    Timestamp: {
      type: String,
      rangeKey: true,
    },
    SessionId: {
      type: String,
      required: true,
    },
    Input: {
      type: String,
      required: true,
    },
    Output: {
      type: String,
    },
  },
  { tableName: AGENTCORE_LOG_TABLE_NAME },
)
