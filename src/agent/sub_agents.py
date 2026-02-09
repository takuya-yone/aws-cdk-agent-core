
from agent_tools import get_weather, tavily_mcp_client
from settings import model_settings
from strands import Agent
from strands_tools.current_time import current_time

model = model_settings.get_model()


weather_agent = Agent(
    name="weather_agent",
    model=model,
    system_prompt=('You are an agent that provides weather information. You will also tell the current time along with the weather. Use the get_weather tool to get the current weather for a specified city, and the current_time tool to get the current time. Timezone is Asia/Tokyo.'),
    tools = [get_weather,current_time]
)


search_agent = Agent(
    name="search_agent",
    model=model,
    system_prompt=('You are a web search agent. Use the tavily_mcp_client tool to perform searches on the web.'),
    tools = [tavily_mcp_client]
)

