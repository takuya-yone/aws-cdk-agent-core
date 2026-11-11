from schemas import StrandsLlmModelEnum
from strands import Agent

from tools import (
    get_market_status,
    get_market_summary,
    get_stock_financial_statement,
    get_stock_info,
)

search_agent_tools = [
    get_stock_info,
    get_market_status,
    get_market_summary,
    get_stock_financial_statement,
]


search_system_prompt = """
You are an expert stock market information agent.
Provide stock information in response to user requests.
Perform a web search if necessary.
Always provide the most up-to-date information.
Answer in Japanese.
"""

search_agent = Agent(
    name="strands-stock-search-agent",
    model=StrandsLlmModelEnum.KIMI_K3_GLOBAL.value,
    system_prompt=search_system_prompt,
    tools=search_agent_tools,
    callback_handler=None,
)
