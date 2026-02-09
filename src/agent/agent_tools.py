from aws_lambda_powertools import Logger
from settings import TavilySettings
from strands import tool
from tavily import TavilyClient

tavily_settings = TavilySettings()
logger = Logger()


@tool
def web_search(query: str) -> dict:
    """Perform a web search using the Tavily API.

    Args:
        query: The search query string

    Returns:
        The search results as a dictionary

    """
    logger.info(f"Performing web search for query: {query}", extra={"query": query, "tool": "web_search"})
    tavily = TavilyClient(api_key=tavily_settings.tavily_api_key)
    result = tavily.search(query)
    return result


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

