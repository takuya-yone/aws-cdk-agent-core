# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AWS CDK TypeScript project that deploys a Bedrock Agent Core Runtime running a Strands-based AI agent. The codebase has two layers: TypeScript CDK infrastructure (`lib/`) and a Python agent runtime (`src/agent/`).

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
```

### Local Development
```bash
pnpm run dev                 # Run local API server (Hono + dotenvx, requires .env)
```

### Package Managers
- **TypeScript**: pnpm (Node 24.13.0 via `.node-version`)
- **Python**: uv (Python 3.14 via `.python-version`)

## Architecture

### Infrastructure Layer (TypeScript CDK)

```
bin/aws-cdk-agent-core.ts
  -> bin/parameter.ts (StackParameters — config types and defaults)
  -> lib/pipeline-stack.ts (PipelineStack — CDK Pipelines V2)
       -> lib/pipeline-app-stage.ts (StackStage)
            -> lib/stack/agent-core-stack.ts (AgentCoreStack)
                 -> lib/constructs/datastore.ts (DatastoreConstruct — DynamoDB tables)
                 -> lib/constructs/rss-retriever.ts (RssRetrieverConstruct — scheduled Lambda)
                 -> lib/constructs/knowledge-base.ts (KnowledgeBaseConstruct — S3 Vectors + Bedrock KB)
                 -> lib/constructs/estate-knowledge-base.ts (EstateKnowledgeBaseConstruct)
                 -> lib/constructs/agent-core.ts (AgentCoreConstruct — Runtime + Memory)
                 -> lib/constructs/cdn.ts (CdnConstruct — CloudFront + S3 frontend)
                 -> lib/constructs/auth.ts (AuthConstruct — Cognito)
                 -> lib/constructs/api-gw.ts (ApiGwConstruct — dual API Gateway + Lambda routers)
            -> lib/stack/sample-stack.ts (SampleStack x3)
```

**CI/CD is entirely CDK Pipelines V2** — no GitHub Actions workflows. The pipeline self-mutates on push to `main`.

**PipelineStack** (`lib/pipeline-stack.ts`) uses GitHub source (`takuya-yone/aws-cdk-agent-core`, `main` branch) with ARM64 CodeBuild. Includes SNS + Slack notifications for pipeline success/failure.

**AgentCoreConstruct** (`lib/constructs/agent-core.ts`) is the core construct. It packages the Python agent from `src/agent/` as an `AgentRuntimeArtifact`, creates a Bedrock Agent Core `Runtime`, sets up `CrossRegionInferenceProfile` entries, creates a Secrets Manager secret for Tavily API key, and creates an AgentCore `Memory` resource with built-in strategies.

**ApiGwConstruct** (`lib/constructs/api-gw.ts`) creates **two** REST API Gateways with Cognito authorizers:
- **Buffered API** (`AgentCoreRestApi`) — standard request/response, used for `/api*` (except invoke)
- **Stream API** (`AgentCoreStreamApi`) — streaming responses via `ResponseTransferMode.STREAM`, used for `/api/invoke*`

Both route through a **Hono-based Lambda router** (`src/lambda/apigw-router/`) with separate handlers (`handler` for buffered, `streamHandler` for streaming). CloudFront distributes traffic to the correct API Gateway based on path pattern.

### Lambda Router (TypeScript — `src/lambda/apigw-router/`)

Hono OpenAPI app with routes:
- `/api/` — root API
- `/api/invoke` — agent invocation (streams via Agent Core Runtime)
- `/api/history` — conversation history (reads from DynamoDB)

Includes Swagger UI at `/api/doc` and OpenAPI spec at `/api/specification`. Local dev runs via `tsx watch` with `@hono/node-server`.

### Agent Runtime Layer (Python — `src/agent/`)

The agent uses a **main-agent → sub-agent delegation** pattern:

- `main.py`: `BedrockAgentCoreApp` entrypoint with three `@tool`-wrapped delegation functions (`call_weather_agent`, `call_search_agent`, `call_aws_rss_agent`). Integrates AgentCore Memory via `AgentCoreMemorySessionManager`.
- `sub_agents.py`: Defines `weather_agent`, `search_agent` (Tavily MCP), and `aws_rss_agent`.
- `agent_tools.py`: Implements `get_weather`, `get_aws_rss_feed` (feedparser), and Tavily `MCPClient`.
- `settings.py`: Pydantic `BaseSettings` for model config, API keys (Secrets Manager in prod, `.env` when `IS_LOCAL=True`), and AgentCore memory ID.

The agent container (`src/agent/Dockerfile`) runs on Alpine + uv, instrumented with OpenTelemetry, exposed on port 8080. **Must be ARM64** for Agent Core Runtime compatibility.

### Stack Parameters

All configuration is centralized in `bin/parameter.ts` via the `StackParameters` interface, including GitHub repo config, Slack notifications, Cognito OAuth settings, API Gateway config (stage name, timeouts, history limits), and Agent Core config (model IDs, knowledge base result counts).

## Code Style

- **TypeScript**: Biome with double quotes, semicolons as-needed, 2-space indent, recommended lint rules
- **Python**: Ruff targeting Python 3.14 with pyflakes, pycodestyle, isort, pyupgrade, pep8-naming rules (E501 ignored)
