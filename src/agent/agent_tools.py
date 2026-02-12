import feedparser
from aws_lambda_powertools import Logger
from mcp.client.streamable_http import streamable_http_client
from models import RssItem
from settings import aws_rss_settings, tavily_settings
from strands import tool
from strands.tools.mcp import MCPClient
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


def _check_keyword_in_rss_entry(rss_item: RssItem, keyword: str) -> bool:
    """Check if the keyword is present in the RSS entry's title or summary."""
    keyword_lower = keyword.lower()
    title = rss_item.title.lower()
    summary = rss_item.summary.lower()
    return keyword_lower in title or keyword_lower in summary


@tool
def get_aws_rss_feed(keyword:str = "AWS", max_items: int = aws_rss_settings.rss_default_items) -> list[RssItem]:
    """Fetch and parse AWS-related RSS feed items based on a keyword.
    Args:
        keyword: The keyword to filter RSS feed items
        max_items: The maximum number of items to return
    Returns:
        A list of RSS feed items matching the keyword
    """
    logger.info(f"Fetching AWS RSS feed for keyword: {keyword}", extra={"keyword": keyword,"max_items": max_items  ,"tool": "get_aws_rss_feed"})

    feed = feedparser.parse(aws_rss_settings.rss_url)
    logger.info(f"Fetched {len(feed.entries)} entries from RSS feed", extra={"tool": "get_aws_rss_feed"})

    max_items = min(max_items, aws_rss_settings.rss_max_items)

    result_items: list[RssItem] = []

    for entry in feed.entries:
        if len(result_items) >= max_items:
            break

        rss_item = RssItem.from_entry(entry)
        if _check_keyword_in_rss_entry(rss_item, keyword):
            result_items.append(rss_item)

    logger.info(f"Returning {len(result_items)} items matching keyword: {keyword}", extra={"keyword": keyword,"returned_items": len(result_items) ,"tool": "get_aws_rss_feed"})

    return result_items


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

