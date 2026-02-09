"""Simple Strands Agent for AgentCore Runtime.

Uses BedrockAgentCoreApp for simplified deployment
"""

from aws_lambda_powertools import Logger
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from settings import model_settings
from strands import Agent, tool
from sub_agents import search_agent, weather_agent

# Initialize the AgentCore app
app = BedrockAgentCoreApp()
model = model_settings.get_model()
logger = Logger()


@tool
def call_weather_agent(city: str) -> str:
    """Agent to get weather information using the get_weather tool.

    Args:
        city: The name of the city

    Returns:
        A string describing the weather

    """

    result = weather_agent(f"Get the weather for {city} and current time.")
    return result


@tool
def call_search_agent(query: str) -> dict:
    """Agent to perform web search using the web_search tool.

    Args:
        query: The search query string

    Returns:
        The search results as a dictionary

    """

    result = search_agent(f"Search the web for {query}")
    return result


# Create agent with the sub-agents as tools
main_agent = Agent(
    name="main_agent",
    model=model,
    tools=[call_weather_agent, call_search_agent],
    system_prompt="""
        You are a kind AI assistant.
        Please answer user questions politely.
        If weather information is needed, please use the call_weather_agent.
        If search is needed, please use the call_search_agent.
        Answer in the language used by the user.
    """
)


@app.entrypoint
async def entrypoint(payload: dict):
    """Handle the agent invocation.

    This function is called when the agent is invoked.

    Args:
        payload: The input payload containing prompt.

    Yields:
        Streaming messages from the agent

    """
    # Extract message and model configuration from payload
    message = payload.get("prompt", "")

    # Stream responses back to the caller
    # stream_messages = agent.stream_async(message)
    # async for msg in stream_messages:
    #     if "event" in msg:
    #         yield msg

    result = await main_agent.invoke_async(message)
    yield result
    # invoke_message = await agent.invoke_async(message)
    # yield invoke_message


if __name__ == "__main__":
    app.run(port=8080)
