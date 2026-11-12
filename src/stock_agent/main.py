import os

from agents import exchange_report_agent
from agents.exchange_exec_agent import exchange_exec_agent
from bedrock_agentcore import BedrockAgentCoreApp
from logger import logger
from schemas import InvocationRequestModel, StrandsLlmModelEnum
from strands import Agent, tool

app = BedrockAgentCoreApp()


@tool
def call_exchange_exec_agent(prompt: str):
    """
    Call the strands-exchange-exec-agent with the given prompt.

    Args:
        prompt (str): The prompt to send to the strands-exchange-exec-agent.
    """
    logger.info("Calling exchange_exec_agent with prompt: %s", prompt)
    return exchange_exec_agent(prompt)


@tool
def call_exchange_report_agent(prompt: str):
    """
    Call the strands-exchange-report-agent with the given prompt.

    Args:
        prompt (str): The prompt to send to the strands-exchange-report-agent.
    """
    logger.info("Calling exchange_report_agent with prompt: %s", prompt)
    return exchange_report_agent(prompt)


main_system_prompt = """
You are an agent that conducts foreign exchange trading.
When researching exchange rates or stock prices, placing orders, or performing web searches, use the strands-exchange-exec-agent.
Place your orders one by one in order.
Whenever you execute a trade, use the strands-exchange-report-agent to save the agent's thought process and trade results to the database for each trade ID.
"""

main_agent = Agent(
    name="strands-exchange-main-agent",
    model=StrandsLlmModelEnum.KIMI_K3_GLOBAL.value,
    system_prompt=main_system_prompt,
    tools=[call_exchange_exec_agent, call_exchange_report_agent],
    callback_handler=None,
)


@app.entrypoint
async def agent_invocation(payload: InvocationRequestModel):
    """Handler for agent invocation"""
    input_model = InvocationRequestModel(**payload)
    stream = main_agent.stream_async(input_model.prompt)
    async for event in stream:
        # print(event)
        yield (event)


if __name__ == "__main__":
    os.environ["BYPASS_TOOL_CONSENT"] = "true"

    # result = search_agent("米ドルの情報")
    # report_agent(str(result))

    # exchange_result = exchange_exec_agent("為替残高を調べて。大きく動いた通貨の買い注文を入れたい")
    # exchange_result = exchange_exec_agent(
    #     "良さそうな通貨があれば注文を入れて。利益最大化を目指して積極的に取引して。過去の取引履歴も参考にすること"
    # )
    # exchange_result = exchange_exec_agent("インテルの最新株価")
    # exchange_result = exchange_exec_agent("ツールの一覧")
    # exchange_report_agent(str(exchange_result))

    # main_system_prompt = """
    # You are an agent that conducts foreign exchange trading.
    # When researching exchange rates or stock prices, placing orders, or performing web searches, use the strands-exchange-exec-agent.
    # Place your orders one by one in order.
    # Whenever you execute a trade, use the strands-exchange-report-agent to save the agent's thought process and trade results to the database for each trade ID.
    # """

    # main_agent = Agent(
    #     name="strands-exchange-main-agent",
    #     model=StrandsLlmModelEnum.KIMI_K3_GLOBAL.value,
    #     system_prompt=main_system_prompt,
    #     tools=[call_exchange_exec_agent, call_exchange_report_agent],
    #     callback_handler=None,
    # )

    app.run()

    # main_agent(
    #     "良さそうな通貨があれば注文を入れて。利益最大化を目指して積極的に取引して。過去の取引履歴も参考にすること"
    # )
