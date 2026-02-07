# Dockerfile for AgentCore Runtime
# Must be ARM64 architecture for AgentCore Runtime

FROM python:3.14-alpine

WORKDIR /app

# Configure UV for container environment
# ENV UV_SYSTEM_PYTHON=1 \
#     UV_COMPILE_BYTECODE=1

# install uv
RUN pip install uv

# Copy requirements and install dependencies

# Copy application code
COPY . .

RUN uv sync


# Set AWS region environment variables
# ENV AWS_REGION=us-west-2 \
#     AWS_DEFAULT_REGION=us-west-2

# Signal that this is running in Docker
# ENV DOCKER_CONTAINER=1

# Expose required ports
EXPOSE 8080
# EXPOSE 8000



# Run the application with OpenTelemetry instrumentation
CMD ["uv", "run", "python", "main.py"]
