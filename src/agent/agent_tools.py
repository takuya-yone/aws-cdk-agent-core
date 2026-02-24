import boto3
import feedparser
import requests
from geopy.geocoders import Nominatim
from mcp.client.streamable_http import streamable_http_client
from models import RssItem
from settings import (
    aws_rss_settings,
    estate_knowledge_base_settings,
    knowledge_base_settings,
    tavily_settings,
)
from strands import tool
from strands.tools.mcp import MCPClient
from tavily import TavilyClient
from utils import logger

tavily_client = TavilyClient(api_key=tavily_settings.tavily_api_key)
tavily_mcp_client = MCPClient(
    lambda: streamable_http_client(
        f"https://mcp.tavily.com/mcp/?tavilyApiKey={tavily_settings.tavily_api_key}"
    )
)

kb_client = boto3.client("bedrock-agent-runtime")
geolocator = Nominatim(user_agent="time-weather-agent", timeout=10)


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
def get_aws_rss_feed(
    keyword: str = "AWS", max_items: int = aws_rss_settings.rss_default_items
) -> list[RssItem]:
    """Fetch and parse AWS-related RSS feed items based on a keyword.
    Args:
        keyword: The keyword to filter RSS feed items
        max_items: The maximum number of items to return
    Returns:
        A list of RSS feed items matching the keyword
    """
    logger.info(
        f"Fetching AWS RSS feed for keyword: {keyword}",
        extra={"keyword": keyword, "max_items": max_items, "tool": "get_aws_rss_feed"},
    )

    feed = feedparser.parse(aws_rss_settings.rss_url)
    logger.info(
        f"Fetched {len(feed.entries)} entries from RSS feed",
        extra={"tool": "get_aws_rss_feed"},
    )

    max_items = min(max_items, aws_rss_settings.rss_max_items)

    result_items: list[RssItem] = []

    for entry in feed.entries:
        if len(result_items) >= max_items:
            break

        rss_item = RssItem.from_entry(entry)
        if _check_keyword_in_rss_entry(rss_item, keyword):
            result_items.append(rss_item)

    logger.info(
        f"Returning {len(result_items)} items matching keyword: {keyword}",
        extra={
            "keyword": keyword,
            "returned_items": len(result_items),
            "tool": "get_aws_rss_feed",
        },
    )

    return result_items


@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location.

    Args:
        location: The city or location name to get the weather for
    """
    try:
        location_data = geolocator.geocode(location)
        if not location_data:
            return "Location not found"

        lat, lon = location_data.latitude, location_data.longitude
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code&timezone=auto"
        response = requests.get(url)

        if response.status_code == 200:
            data = response.json()
            temp = data.get("current", {}).get("temperature_2m", "N/A")
            code = data.get("current", {}).get("weather_code", "N/A")

            weather_codes = {
                0: "Clear sky",
                1: "Mainly clear",
                2: "Partly cloudy",
                3: "Overcast",
                45: "Fog",
                48: "Depositing rime fog",
                51: "Light drizzle",
                53: "Moderate drizzle",
                55: "Dense drizzle",
                61: "Light rain",
                63: "Moderate rain",
                65: "Heavy rain",
                71: "Light snow",
                73: "Moderate snow",
                75: "Heavy snow",
                95: "Thunderstorm",
            }
            weather_desc = weather_codes.get(code, f"Unknown (code {code})")

            return f"{weather_desc}, {temp}°C"

        return "Weather data currently unavailable"
    except Exception as e:
        print(f"Weather error: {e}")
        return "Weather service is currently unavailable"


@tool
def get_frontend_best_practices(topic: str) -> str:
    """Provide best practices for front-end applications using React and Next.js.
    Args:
        topic: The specific topic or area of interest
    Returns:
        A string describing best practices
    """
    logger.info(
        f"Fetching front-end best practices for topic: {topic}",
        extra={"topic": topic, "tool": "get_frontend_best_practices"},
    )
    response = kb_client.retrieve_and_generate(
        input={"text": topic},
        retrieveAndGenerateConfiguration={
            "type": "KNOWLEDGE_BASE",
            "knowledgeBaseConfiguration": {
                "knowledgeBaseId": knowledge_base_settings.bedrock_kb_id,  # ナレッジベースID
                "modelArn": knowledge_base_settings.kb_model_id,  # 回答を行うモデルのARN（詳細は補足に記載）
                "retrievalConfiguration": {
                    "vectorSearchConfiguration": {
                        "numberOfResults": knowledge_base_settings.kb_result_nums,  # ナレッジベースから取得する関連情報の数
                    }
                },
            },
        },
    )

    text = response["output"]["text"]
    citations = response["citations"]
    logger.info(
        f"Retrieved {len(citations)} citations from knowledge base",
        extra={
            "text": text,
            "citations_count": len(citations),
            "tool": "get_frontend_best_practices",
        },
    )
    return text


@tool
def get_estate_info(query: str) -> dict:
    """Provide information about real estate based on user queries.
    Args:
        query: The query string related to estate information
    Returns:
        The retrieval results as a dictionary
    """
    logger.info(
        f"Fetching estate information for query: {query}",
        extra={"query": query, "tool": "get_estate_info"},
    )
    response = kb_client.retrieve_and_generate(
        input={"text": query},
        retrieveAndGenerateConfiguration={
            "type": "KNOWLEDGE_BASE",
            "knowledgeBaseConfiguration": {
                "knowledgeBaseId": estate_knowledge_base_settings.bedrock_estate_kb_id,  # ナレッジベースID
                "modelArn": estate_knowledge_base_settings.kb_model_id,  # 回答を行うモデルのARN（詳細は補足に記載）
                "retrievalConfiguration": {
                    "vectorSearchConfiguration": {
                        "numberOfResults": estate_knowledge_base_settings.estate_kb_result_nums,  # ナレッジベースから取得する関連情報の数
                    }
                },
            },
        },
    )
    text = response["output"]["text"]
    citations = response["citations"]
    logger.info(
        f"Retrieved {len(citations)} citations from knowledge base",
        extra={
            "text": text,
            "citations_count": len(citations),
            "tool": "get_estate_info",
        },
    )
    return text
