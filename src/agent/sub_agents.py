from agent_tools import (
    get_aws_rss_feed,
    get_estate_info,
    get_frontend_best_practices,
    get_weather,
    tavily_mcp_client,
)
from settings import model_settings
from strands import Agent
from strands_tools import use_aws
from strands_tools.current_time import current_time

model = model_settings.get_model()


weather_agent = Agent(
    name="weather_agent",
    model=model,
    system_prompt=(
        "You are an agent that provides weather information. You will also tell the current time along with the weather. Use the get_weather tool to get the current weather for a specified city, and the current_time tool to get the current time. Timezone is Asia/Tokyo. Answer in Japanese."
    ),
    tools=[get_weather, current_time],
)


search_agent = Agent(
    name="search_agent",
    model=model,
    system_prompt=(
        "You are a web search agent. Use the tavily_mcp_client tool to perform searches on the web. Answer in Japanese."
    ),
    tools=[tavily_mcp_client],
)


aws_rss_agent = Agent(
    name="aws_rss_agent",
    model=model,
    system_prompt=(
        "You are an agent that fetches AWS-related RSS feed items. Use the get_aws_rss_feed tool to get the latest AWS news based on a keyword. Answer in Japanese."
    ),
    tools=[get_aws_rss_feed],
)


react_agent = Agent(
    name="react_agent",
    model=model,
    system_prompt=(
        "You are an agent that provides best practices for front-end applications, familiar with React and Next.js. Use the get_frontend_best_practices tool to provide guidance. Answer in Japanese."
    ),
    tools=[get_frontend_best_practices],
)


estate_agent = Agent(
    name="estate_agent",
    model=model,
    system_prompt=(
        "You are an agent that provides information about real estate. Use the get_estate_info tool to fetch real estate information based on user queries. Datasource is formatted as Markdown Table. The 'Data ID' field in referenced Markdown Table must be included. Answer in Japanese."
    ),
    tools=[get_estate_info],
)


aws_access_agent = Agent(
    name="aws_access_agent",
    model=model,
    system_prompt=(
        "You are an agent that provides guidance on AWS access and usage. Use the use_aws tool to provide guidance. If no region is specified, please target ap-northeast-1. If an error occurs, please terminate the process without retrying. Answer in Japanese."
    ),
    tools=[use_aws],
)
