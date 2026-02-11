"""Simple Strands Agent for AgentCore Runtime.

Uses BedrockAgentCoreApp for simplified deployment
"""
from aws_lambda_powertools import Logger
from bedrock_agentcore.memory.integrations.strands.config import AgentCoreMemoryConfig
from bedrock_agentcore.memory.integrations.strands.session_manager import (
    AgentCoreMemorySessionManager,
)
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from nanoid import generate
from settings import memory_settings, model_settings
from strands import Agent, tool
from sub_agents import aws_rss_agent, search_agent, weather_agent

# Initialize the AgentCore app
app = BedrockAgentCoreApp()
model = model_settings.get_model()
memory_settings = memory_settings()
logger = Logger()


@tool
def call_weather_agent(city: str) -> str:
    """Call agent to get weather information using the weather_agent.
    Args:
        city: The name of the city
    Returns:
        A string describing the weather
    """

    result = weather_agent(f"Get the weather for {city} and current time.")
    logger.info(f"Weather agent called for city: {city}", extra={"city": city, "tool": "call_weather_agent"})
    return result


@tool
def call_search_agent(query: str) -> dict:
    """Call agent to perform web search using the search_agent.
    Args:
        query: The search query string
    Returns:
        The search results as a dictionary
    """

    result = search_agent(f"Search the web for {query}")
    logger.info(f"Search agent called for query: {query}", extra={"query": query, "tool": "call_search_agent"})
    return result


@tool
def call_aws_rss_agent(keyword: str) -> list:
    """Call agent to fetch AWS RSS feed items using the aws_rss_agent.
    Args:
        keyword: The keyword to search for in the RSS feed
    Returns:
        A list of RSS feed items matching the keyword
    """

    result = aws_rss_agent(f"Fetch RSS feed items for {keyword}")
    logger.info(f"AWS RSS agent called for keyword: {keyword}", extra={"keyword": keyword, "tool": "call_aws_rss_agent"})
    return result


@app.entrypoint
async def entrypoint(payload: dict):
    """Handle the agent invocation.
    This function is called when the agent is invoked.
    Args:
        payload: The input payload containing prompt.
    Yields:
        Streaming messages from the agent
    """
    invocation_id = generate()

    # Extract message and model configuration from payload
    message = payload.get("prompt", "")
    actor_id = payload.get("actor_id",invocation_id)
    session_id = payload.get("session_id", invocation_id)

    agentcore_memory_config = AgentCoreMemoryConfig(
        memory_id=memory_settings.memory_id,
        session_id=session_id,
        actor_id=actor_id
    )
    agentcore_session_manager = AgentCoreMemorySessionManager(
        agentcore_memory_config=agentcore_memory_config,
    )

    # Create agent with the sub-agents as tools
    main_agent = Agent(
        name="main_agent",
        model=model,
        session_manager=agentcore_session_manager,
        tools=[call_weather_agent, call_search_agent, call_aws_rss_agent],
        system_prompt="""
            You are a kind AI assistant.
            Please answer user questions politely.
            If weather information is needed, please use the call_weather_agent.
            If information is unknown, use call_search_agent to search.
            If AWS RSS feed items are needed, use call_aws_rss_agent to fetch them.
            Answer in the language used by the user.
        """
    )

    # Stream responses back to the caller
    stream_messages = main_agent.stream_async(message)
    async for msg in stream_messages:
        if "event" in msg:
            yield msg

    # result = await main_agent.invoke_async(message)
    # yield result


if __name__ == "__main__":
    app.run(port=8080)
