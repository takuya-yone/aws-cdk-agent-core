from aws_lambda_powertools import Logger
from mcp.client.streamable_http import streamable_http_client
from settings import tavily_settings
from strands import tool
from strands.tools.mcp import MCPClient

# from strands_tools.tavily import tavily_search
from tavily import TavilyClient

tavily_client = TavilyClient(api_key=tavily_settings.tavily_api_key)
tavily_mcp_client = MCPClient(lambda: streamable_http_client(f'https://mcp.tavily.com/mcp/?tavilyApiKey={tavily_settings.tavily_api_key}'))

logger = Logger()



# @tool
# def web_search(query: str) -> dict:
#     """Perform a web search using the Tavily API.

#     Args:
#         query: The search query string

#     Returns:
#         The search results as a dictionary

#     """
#     logger.info(f"Performing web search for query: {query}", extra={"query": query, "tool": "web_search"})
#     # result = tavily_search(query,search_depth='advanced',topic='news',max_results=10)
#     result = tavily_client.search(query)
#     return result


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

