# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AWS CDK TypeScript project that deploys a Bedrock Agent Core Runtime running a Strands-based AI agent. The codebase has two layers: TypeScript CDK infrastructure (`lib/`) and a Python agent runtime (`src/agent/`).

## Commands

### Build & Deploy
```bash
pnpm run build              # Compile TypeScript
pnpm run watch              # Compile TypeScript in watch mode
pnpm cdk synth              # Generate CloudFormation template
pnpm cdk deploy             # Deploy stack to AWS
pnpm cdk diff               # Compare deployed vs current state
```

### Lint & Format
```bash
pnpm run biome:fix           # Fix TypeScript with Biome (bin/ lib/ tests/)
pnpm run ruff:fix            # Fix Python with Ruff (src/)
```

### Test
```bash
pnpm run test                # Run Vitest tests
pnpm run test -- tests/aws-cdk-agent-core.test.ts  # Run a single test file
```

### Package Managers
- **TypeScript**: pnpm (Node 24.13.0 via `.node-version`)
- **Python**: uv (Python 3.14 via `.python-version`)

## Architecture

### Infrastructure Layer (TypeScript CDK)

```
bin/aws-cdk-agent-core.ts
  -> lib/pipeline-stack.ts (PipelineStack - CDK Pipelines V2)
       -> lib/pipeline-app-stage.ts (StackStage)
            -> lib/stack/agent-core-stack.ts (AgentCoreStack)
                 -> lib/constructs/agent-core.ts (AgentCoreConstruct)
                 -> lib/constructs/auth.ts (AuthConstruct)
                 -> lib/constructs/api-gw.ts (ApiGwConstruct)
                      -> src/lambda/agent-core-proxy.ts (Lambda proxy)
            -> lib/stack/sample-stack.ts (SampleStack x3)
```

**CI/CD is entirely CDK Pipelines V2** — no GitHub Actions workflows. The pipeline self-mutates on push to `main`.

**PipelineStack** (`lib/pipeline-stack.ts`) uses GitHub source (`takuya-yone/aws-cdk-agent-core`, `main` branch) with ARM64 CodeBuild (`AMAZON_LINUX_2_ARM_3`). Includes SNS + Slack notifications for pipeline success/failure.

**AgentCoreConstruct** (`lib/constructs/agent-core.ts`) is the core construct. It:
1. Packages the Python agent from `src/agent/` as an `AgentRuntimeArtifact`
2. Creates a Bedrock Agent Core `Runtime` resource
3. Sets up `CrossRegionInferenceProfile` entries for JP (Claude Sonnet 4.5), APAC (Amazon Nova Pro), and US (Amazon Nova Pro) regions and grants invoke permissions
4. Creates a Secrets Manager secret for Tavily API key
5. Creates an AgentCore `Memory` resource with built-in strategies (summarization, semantic, user preference, episodic) and grants read/write permissions to the runtime

**AuthConstruct** (`lib/constructs/auth.ts`) creates a Cognito User Pool with OAuth configuration (self-signup disabled) used to authenticate API requests.

**ApiGwConstruct** (`lib/constructs/api-gw.ts`) creates a REST API Gateway with Cognito authorizer and a Lambda proxy function (`src/lambda/agent-core-proxy.ts`) that forwards requests to the Agent Core Runtime, streaming responses back to clients. The Lambda extracts actor ID from Cognito claims (`sub`) and manages session IDs.

### Agent Runtime Layer (Python)

The agent uses a **main-agent → sub-agent delegation** pattern:

- `main.py`: `BedrockAgentCoreApp` entrypoint. Defines a main agent with three `@tool`-wrapped functions (`call_weather_agent`, `call_search_agent`, `call_aws_rss_agent`) that delegate to sub-agents. Integrates AgentCore Memory via `AgentCoreMemorySessionManager` for persistent conversation context. Streams responses asynchronously via `agent.stream_async()`.
- `sub_agents.py`: Defines `weather_agent` (uses `get_weather` + `current_time` tools), `search_agent` (uses Tavily MCP client for web search), and `aws_rss_agent` (uses `get_aws_rss_feed` tool to fetch AWS news).
- `agent_tools.py`: Implements `get_weather` (hardcoded city data), `get_aws_rss_feed` (fetches AWS RSS feed with keyword filtering via `feedparser`), and creates an `MCPClient` for Tavily web search via streamable HTTP.
- `models.py`: Defines `RssItem` Pydantic model for RSS feed parsing.
- `settings.py`: Pydantic `BaseSettings` for model config (`ModelSettings`), Tavily API key (`TavilySettings`), AWS RSS config (`AwsRssSettings`), and AgentCore memory ID (`AgentCoreMemorySettings`). In production, reads the API key from Secrets Manager; locally uses `.env` when `IS_LOCAL=True`.

The agent container (`src/agent/Dockerfile`) runs on Alpine + uv, instrumented with OpenTelemetry, exposed on port 8080. **Must be ARM64** for Agent Core Runtime compatibility.

### Key Dependencies
- **CDK**: `@aws-cdk/aws-bedrock-agentcore-alpha`, `@aws-cdk/aws-bedrock-alpha`, `cdk-ecr-deployment`
- **Lambda proxy**: `@aws-sdk/client-bedrock-agentcore`, `@aws-lambda-powertools/logger`, `@aws-lambda-powertools/tracer`, `@middy/core`, `zod`
- **Agent**: `strands-agents`, `strands-agents-tools`, `bedrock-agentcore`, `tavily`, `feedparser`, `aws-opentelemetry-distro`, `pydantic-settings`

## Code Style

- **TypeScript**: Biome with double quotes, semicolons as-needed, 2-space indent, recommended lint rules
- **Python**: Ruff targeting Python 3.14 with pyflakes, pycodestyle, isort, pyupgrade, pep8-naming rules (E501 ignored)
