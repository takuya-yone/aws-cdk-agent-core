from schemas import StrandsLlmModelEnum
from strands import Agent
from strands_tools import file_write
from tools.exchange_report_tools import (
    put_exchange_report_to_dynamodb,
)

exchange_report_system_prompt = """
You are an expert currency exchange report agent.
Based on the provided information, briefly summarize the thought process behind foreign exchange trading.Create a Markdown file under the '''reports''' directory.
Create report in Japanese.
Name the file with the transaction ID included in the input.
Put the report to DynamoDB after generating it.
"""

exchange_report_agent_tools = [file_write, put_exchange_report_to_dynamodb]

exchange_report_agent = Agent(
    name="strands-exchange-report-agent",
    model=StrandsLlmModelEnum.KIMI_K3_GLOBAL.value,
    system_prompt=exchange_report_system_prompt,
    tools=exchange_report_agent_tools,
    callback_handler=None,
)
