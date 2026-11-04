from schemas import StrandsLlmModelEnum
from strands import Agent
from strands_tools import file_write

report_system_prompt = """
You are an expert stock market report agent.
Create concise reports in Markdown format based on the information provided.
Don't modify the provided information.
Create a Markdown file under the '''reports''' directory.
Create report in Japanese.
"""

report_agent_tools = [file_write]

report_agent = Agent(
    name="strands-stock-report-agent",
    model=StrandsLlmModelEnum.NOVA_2_LITE_GLOBAL.value,
    system_prompt=report_system_prompt,
    tools=report_agent_tools,
    callback_handler=None,
)
