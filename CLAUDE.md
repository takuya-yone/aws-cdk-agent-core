# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AWS CDK TypeScript project that deploys a Bedrock Agent Core Runtime running a Strands-based AI agent. The codebase has two layers: TypeScript CDK infrastructure (`lib/`) and a Python agent runtime (`src/agent/`).

## Commands

### Build & Deploy
```bash
pnpm run build              # Compile TypeScript
pnpm cdk synth              # Generate CloudFormation template
pnpm cdk deploy             # Deploy stack to AWS
pnpm cdk diff               # Compare deployed vs current state
```

### Lint & Format
```bash
pnpm run biome:fix           # Fix TypeScript with Biome (lib/)
pnpm run ruff:fix            # Fix Python with Ruff (src/)
```

### Test
```bash
pnpm run test                # Run Vitest tests
```

### Package Managers
- **TypeScript**: pnpm (Node 24.13.0)
- **Python**: uv (Python 3.14)

## Architecture

### Infrastructure Layer (TypeScript CDK)

`bin/aws-cdk-agent-core.ts` -> `lib/aws-cdk-agent-core-stack.ts` -> `lib/constructs/agent-core.ts`

`AgentCoreConstruct` (`lib/constructs/agent-core.ts`) is the core construct. It:
1. Packages the Python agent from `src/agent/` as an `AgentRuntimeArtifact`
2. Creates a Bedrock Agent Core `Runtime` resource
3. Sets up `CrossRegionInferenceProfile` entries for JP (Claude Sonnet 4.5) and APAC (Amazon Nova Pro) regions and grants invoke permissions

### Agent Runtime Layer (Python)

`src/agent/main.py` implements the agent using Strands framework with `BedrockAgentCoreApp`. It defines tools via the `@tool` decorator and an async entrypoint via `@app.entrypoint` that streams responses. The agent is containerized via `src/agent/Dockerfile` (Alpine + uv + OpenTelemetry instrumentation).

### Key Dependencies
- **CDK**: `@aws-cdk/aws-bedrock-agentcore-alpha`, `@aws-cdk/aws-bedrock-alpha`
- **Agent**: `strands-agents`, `bedrock-agentcore`, `aws-opentelemetry-distro`

## Code Style

- **TypeScript**: Biome with double quotes, semicolons as-needed, 2-space indent, recommended lint rules
- **Python**: Ruff targeting Python 3.14 with pyflakes, pycodestyle, isort, pyupgrade, pep8-naming rules (E501 ignored)
