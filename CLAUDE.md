# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AWS CDK TypeScript project that deploys Bedrock Agent Core Runtimes running Strands-based AI agents. The codebase has two layers: TypeScript CDK infrastructure (`lib/`) and Python agent runtimes. There are two independent agent systems, each deployed as its own stack:

- **AgentCoreStack** — general-purpose chat agent (`src/sandbox_agent/`) with Cognito-protected API/CloudFront frontend
- **StockAgentStack** — FX trading agent (`src/stock_agent/`) invoked on a daily schedule, no frontend

## Commands

### Build & Deploy
```bash
pnpm run build              # Compile TypeScript (tsc --noEmit)
pnpm run watch              # Compile TypeScript in watch mode
pnpm cdk synth              # Generate CloudFormation template
pnpm cdk deploy             # Deploy stack to AWS
pnpm cdk diff               # Compare deployed vs current state
```

### Lint & Format
```bash
pnpm run biome:fix           # Fix TypeScript with Biome (bin/ lib/ src/ tests/)
pnpm run biome:dry           # Check TypeScript without writing
pnpm run ruff:fix            # Fix Python with Ruff (src/ tools/ tests/)
pnpm run ruff:dry            # Check Python without writing
```

### Test
```bash
pnpm run test                # Run Vitest tests (TypeScript)
pnpm run test -- tests/src/rss-retriever.test.ts  # Run a single TS test file
pnpm run pytest              # Run pytest tests (Python) with coverage
pnpm run test:cov            # Run Vitest with coverage
```

### Git Hooks / CI
- Husky `pre-commit` runs `pnpm biome:dry` and `pnpm ruff:dry`.
- GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main`: Lint (Biome + Ruff), Test (Vitest + pytest), Build (`tsc`), Synth (`cdk synth`). Deployment is still done only by CDK Pipelines.

### Local Development
```bash
pnpm run dev                 # Run local API server (Hono + dotenvx, requires .env)
```

### Package Managers
- **TypeScript**: pnpm (Node 24.13.0 via `.node-version`)
- **Python**: uv (Python 3.14 via `.python-version`)

## Architecture

### Infrastructure Layer (TypeScript CDK)

Constructs are grouped by stack under `lib/constructs/agent-core/` and `lib/constructs/stock-agent/`, and re-exported via `lib/constructs/index.ts`.

```
bin/aws-cdk-agent-core.ts
  -> bin/parameter.ts (StackParameters — config types and defaults)
  -> lib/pipeline-stack.ts (PipelineStack — CDK Pipelines V2)
       -> lib/pipeline-app-stage.ts (StackStage)
            -> lib/stack/agent-core-stack.ts (AgentCoreStack)
                 -> constructs/agent-core/datastore.ts (DatastoreConstruct — DynamoDB tables)
                 -> constructs/agent-core/rss-retriever.ts (RssRetrieverConstruct — scheduled Lambda)
                 -> constructs/agent-core/knowledge-base.ts (KnowledgeBaseConstruct — S3 Vectors + Bedrock KB)
                 -> constructs/agent-core/estate-knowledge-base.ts (EstateKnowledgeBaseConstruct)
                 -> constructs/agent-core/reinvent2026-knowledge-base.ts (Reinvent2026KnowledgeBaseConstruct)
                 -> constructs/agent-core/agent-core.ts (AgentCoreConstruct — Runtime + Memory)
                 -> constructs/agent-core/cdn.ts (CdnConstruct — CloudFront + S3 frontend)
                 -> constructs/agent-core/auth.ts (AuthConstruct — Cognito)
                 -> constructs/agent-core/api-gw.ts (ApiGwConstruct — dual API Gateway + Lambda routers)
            -> lib/stack/stock-agent-stack.ts (StockAgentStack)
                 -> constructs/stock-agent/datastore.ts (StockDatastoreConstruct — FX balance/history/order DynamoDB tables + order summary S3 bucket)
                 -> constructs/stock-agent/agent-core-gw.ts (AgentCoreGwConstruct — IAM-authorized Gateway + Web Search target)
                 -> constructs/stock-agent/agent-core-runtime.ts (AgentCoreRuntimeConstruct — Runtime + user notification SNS topic)
                 -> constructs/stock-agent/agent-core-scheduler.ts (AgentCoreSchedulerConstruct — EventBridge Scheduler + Lambda)
```

`lib/stack/sample-stack.ts` (`SampleStack`) still exists but is commented out in `StackStage`.

**Deployment is entirely CDK Pipelines V2.** The pipeline self-mutates on push to `main`. (GitHub Actions is used only for CI checks, not deploy.)

**PipelineStack** (`lib/pipeline-stack.ts`) uses GitHub source (`takuya-yone/aws-cdk-agent-core`, `main` branch) with ARM64 CodeBuild. Includes SNS + Slack notifications for pipeline success/failure.

**AgentCoreConstruct** (`lib/constructs/agent-core.ts`) is the core construct. It packages the Python agent from `src/sandbox_agent/` as an `AgentRuntimeArtifact`, creates a Bedrock Agent Core `Runtime`, sets up `CrossRegionInferenceProfile` entries, creates a Secrets Manager secret for Tavily API key, and creates an AgentCore `Memory` resource with built-in strategies.

**ApiGwConstruct** (`lib/constructs/api-gw.ts`) creates **two** REST API Gateways with Cognito authorizers:
- **Buffered API** (`AgentCoreRestApi`) — standard request/response, used for `/api*` (except invoke)
- **Stream API** (`AgentCoreStreamApi`) — streaming responses via `ResponseTransferMode.STREAM`, used for `/api/invoke*`

**StockAgentStack** details:
- `AgentCoreRuntimeConstruct` builds `src/stock_agent/` as a Runtime (`PlatformVersion.V2`, tracing disabled, CloudWatch application logs). It attaches `AmazonBedrockLimitedAccess`, and grants access to the Gateway, the three DynamoDB tables, the S3 bucket and SNS topic (env vars `FX_*_TABLE_NAME`, `FX_ORDER_SUMMARY_BUCKET_NAME`, `USER_NOTIFICATION_TOPIC_ARN`, `AGENT_CORE_GATEWAY_URL`).
- `AgentCoreSchedulerConstruct` runs EventBridge Scheduler daily at 09:00 JST, targeting the `StockAgentCoreRuntimeSchedulerLambda` (`src/lambda/agent-core-runtime-scheduler.ts`, middy + Powertools), which calls `InvokeAgentRuntime` with a fixed trading prompt and returns the response body as a string. The Runtime ARN is passed via `AGENT_CORE_RUNTIME_ARN`.

Both route through a **Hono-based Lambda router** (`src/lambda/apigw-router/`) with separate handlers (`handler` for buffered, `streamHandler` for streaming). CloudFront distributes traffic to the correct API Gateway based on path pattern.

### Lambda Router (TypeScript — `src/lambda/apigw-router/`)

Hono OpenAPI app with routes:
- `/api/` — root API
- `/api/invoke` — agent invocation (streams via Agent Core Runtime)
- `/api/history` — conversation history (reads from DynamoDB)

Includes Swagger UI at `/api/doc` and OpenAPI spec at `/api/specification`. Local dev runs via `tsx watch` with `@hono/node-server`.

Other Lambdas in `src/lambda/`: `rss-retriever.ts` (scheduled RSS fetch), `agent-core-proxy.ts` (SSE proxy to the Runtime), `agent-core-runtime-scheduler.ts` (see StockAgentStack).

### Agent Runtime Layer — Sandbox Agent (Python — `src/sandbox_agent/`)

The agent uses a **main-agent → sub-agent delegation** pattern:

- `main.py`: `BedrockAgentCoreApp` entrypoint with three `@tool`-wrapped delegation functions (`call_weather_agent`, `call_search_agent`, `call_aws_rss_agent`). Integrates AgentCore Memory via `AgentCoreMemorySessionManager`.
- `sub_agents.py`: Defines `weather_agent`, `search_agent` (Tavily MCP), and `aws_rss_agent`.
- `agent_tools.py`: Implements `get_weather`, `get_aws_rss_feed` (feedparser), and Tavily `MCPClient`.
- `settings.py`: Pydantic `BaseSettings` for model config, API keys (Secrets Manager in prod, `.env` when `IS_LOCAL=True`), and AgentCore memory ID.

The agent container (`src/sandbox_agent/Dockerfile`) runs on Alpine + uv, instrumented with OpenTelemetry, exposed on port 8080. **Must be ARM64** for Agent Core Runtime compatibility.

### Agent Runtime Layer — Stock Agent (Python — `src/stock_agent/`)

FX trading agent using the same main-agent → sub-agent delegation pattern:

- `main.py`: `BedrockAgentCoreApp` entrypoint; `main_agent` (model `KIMI_K3_GLOBAL`) delegates via `call_exchange_exec_agent` and `call_exchange_report_agent`. Streams events from `main_agent.stream_async(prompt)`; input is `InvocationRequestModel` (`schemas.py`).
- `agents/`: `exchange_exec_agent` (rates, balances, orders, web search via Gateway), `exchange_report_agent` (saves reasoning/results per trade ID), plus `search_agent` and `report_agent`.
- `tools/`: `exchange_exec_tools` (`get_exchange_info`, `get_fx_balance`, `generate_transaction_id`, `order`, `get_order_histories`), `exchange_report_tools` (`put_exchange_report_to_s3` / `_to_dynamodb`, `send_email` via SNS), `market_tools`, `stock_tools`.
- `db/balance_db.py`, `services/` (exchange service): DynamoDB access and order logic.
- `settings.py`: Pydantic `BaseSettings` reading required env vars set by the CDK Runtime (no `.env` fallback).

It has its own `pyproject.toml`/`uv.lock` and `Dockerfile` (ARM64 required).

### Stack Parameters

All configuration is centralized in `bin/parameter.ts` via the `StackParameters` interface, including GitHub repo config, Slack notifications, Cognito OAuth settings, API Gateway config (stage name, timeouts, history limits), and Agent Core config (model IDs, knowledge base result counts). Both `AgentCoreStack` and `StockAgentStack` receive `defaultStackParameters`.

## Code Style

- **TypeScript**: Biome with double quotes, semicolons as-needed, 2-space indent, recommended lint rules
- **Python**: Ruff targeting Python 3.14 with pyflakes, pycodestyle, isort, pyupgrade, pep8-naming rules (E501 ignored)
