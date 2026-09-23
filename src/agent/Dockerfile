# Dockerfile for AgentCore Runtime
# Must be ARM64 architecture for AgentCore Runtime
#
# Build context is the repository root (not this directory) because
# pyproject.toml / uv.lock are managed there.
# See lib/constructs/agent-core.ts (AgentRuntimeArtifact.fromAsset)

# FROM python:3.14-alpine
FROM public.ecr.aws/docker/library/python:3.14-alpine

WORKDIR /app

# install uv
RUN pip install uv==0.12.17

# Install dependencies first so this layer stays cached
# when only the application code changes
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Copy application code
COPY src/agent/ ./src/agent/

# Signal that this is running in Docker
ENV DOCKER_CONTAINER=1

# Expose required ports
# AgentCore Runtime listens on port 8080 for incoming requests
EXPOSE 8080

# Flat imports (e.g. `from models import ...`) require this directory as CWD.
# The virtualenv lives at /app/.venv and is resolved by uv from here.
WORKDIR /app/src/agent

# Run the application with OpenTelemetry instrumentation
# CMD ["uv", "run", "--no-sync", "opentelemetry-instrument", "python", "main.py", "-q"]
CMD ["uv", "run", "--no-sync", "opentelemetry-instrument", "python", "main.py"]
