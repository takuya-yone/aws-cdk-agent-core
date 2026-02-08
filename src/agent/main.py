"""Simple Strands Agent for AgentCore Runtime.

Uses BedrockAgentCoreApp for simplified deployment
"""
import json
import os
from functools import cached_property

from aws_lambda_powertools import Logger
from aws_lambda_powertools.utilities import parameters
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from strands import Agent, tool
from strands.models import BedrockModel
from tavily import TavilyClient

# .envファイルの内容を読み込む
load_dotenv('.env')


def is_local() -> bool:
    return os.getenv("IS_LOCAL") == "True"


class TavilySettings(BaseSettings):
    model_config = SettingsConfigDict(frozen=False)

    tavily_secret_name: str = Field(env="TAVILY_SECRET_NAME")

    @cached_property
    def tavily_api_key(self) -> str:
        if is_local() and os.getenv("TAVILY_SECRET_KEY"):
            return os.getenv("TAVILY_SECRET_KEY")
        secret = json.loads(parameters.get_secret(self.tavily_secret_name, max_age=300))
        return secret.get("TAVILY_API_KEY")


class ModelSettings(BaseSettings):
    model_id: str = Field(env="MODEL_ID")
    max_tokens: int = Field(default=2048, env="MAX_TOKENS")
    temperature: float = Field(default=0.7, env="TEMPERATURE")
    top_p: float = Field(default=0.9, env="TOP_P")

    def get_model(self) -> BedrockModel:
        return BedrockModel(
            model_id=self.model_id,
        )

# Initialize the AgentCore app
app = BedrockAgentCoreApp()


tavily_settings = TavilySettings()
model_settings = ModelSettings()
model = model_settings.get_model()
logger = Logger()


@tool
def get_weather(city: str) -> str:
    """Get the current weather for a specified city.

    Args:
        city: The name of the city

    Returns:
        A string describing the weather

    """
    logger.info(f"Fetching weather for city: {city}", extra={"city": city, "tool": "get_weather"})
    weather_data = {
        "Tokyo": "晴れ、気温25度",
        "東京": "晴れ、気温25度",
        "Osaka": "曇り、気温22度",
        "大阪": "曇り、気温22度",
        "New York": "Rainy, 18°C",
        "London": "Foggy, 15°C",
    }

    return weather_data.get(city, f"{city}の天気情報は現在利用できません")


@tool
def web_search(query: str) -> str:
    """Perform a web search using the Tavily API.

    Args:
        query: The search query string

    Returns:
        The search results as a string

    """
    logger.info(f"Performing web search for query: {query}", extra={"query": query, "tool": "web_search"})
    tavily = TavilyClient(api_key=tavily_settings.tavily_api_key)
    return tavily.search(query)


@app.entrypoint
async def entrypoint(payload: dict):
    """Handle the agent invocation.

    This function is called when the agent is invoked.

    Args:
        payload: The input payload containing prompt and optional model config

    Yields:
        Streaming messages from the agent

    """
    # Extract message and model configuration from payload
    message = payload.get("prompt", "")

    # Create agent with the weather tool
    agent = Agent(
        model=model,
        tools=[get_weather, web_search],
        system_prompt="""
            You are a kind AI assistant.
            Please answer user questions politely.
            If weather information is needed, please use the get_weather tool.
            If web search is needed, please use the web_search tool.
            Answer in the language used by the user.
        """
    )

    # Stream responses back to the caller
    stream_messages = agent.stream_async(message)
    async for msg in stream_messages:
        if "event" in msg:
            yield msg

    # invoke_message = await agent.invoke_async(message)
    # yield invoke_message


if __name__ == "__main__":
    app.run(port=8080)
