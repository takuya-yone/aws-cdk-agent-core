"""Simple Strands Agent for AgentCore Runtime.

Uses BedrockAgentCoreApp for simplified deployment
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# strands.agent.agent_result.AgentResult
# Initialize the AgentCore app
# app = BedrockAgentCoreApp()
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def entrypoint():
    """
    Entry point for handling agent invocations.
    """

    return "Hello, World!"


# Define API endpoints
@app.get("/ping")
async def ping():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/invocations", response_model=dict)
async def invocations(payload: dict) -> dict:
    result = await entrypoint()
    return {"result": result}


if __name__ == "__main__":
    # AgentCore Runtime listens on port 8080 for incoming requests
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=False)
