# Dockerfile for AgentCore Runtime
# Must be ARM64 architecture for AgentCore Runtime

FROM python:3.14-alpine

WORKDIR /app

# install uv
RUN pip install uv

# Copy application code
COPY . .

RUN uv sync

# Signal that this is running in Docker
ENV DOCKER_CONTAINER=1

# Expose required ports
# AgentCore Runtime listens on port 8080 for incoming requests
EXPOSE 8080

# Run the application with OpenTelemetry instrumentation
# CMD ["uv", "run", "opentelemetry-instrument", "python", "main.py", "-q"]
CMD ["uv", "run","opentelemetry-instrument", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]