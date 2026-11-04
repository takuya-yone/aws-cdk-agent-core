from mcp_proxy_for_aws.client import aws_iam_streamablehttp_client
from schemas import StrandsLlmModelEnum
from settings import settings
from strands import Agent
from strands.tools.mcp import MCPClient

from tools import (
    generate_transaction_id,
    get_exchange_info,
    get_fx_balance,
    get_order_histories,
    order,
)

mcp_client = MCPClient(
    lambda: aws_iam_streamablehttp_client(
        endpoint=settings.agent_core_gateway_url,
        aws_service="bedrock-agentcore",
    )
)

exchange_exec_agent_tools = [
    get_exchange_info,
    get_fx_balance,
    order,
    generate_transaction_id,
    get_order_histories,
]

exchange_system_prompt = """
You are an expert foreign exchange information agent.
Provide exchange rate information in response to user requests.
Always provide the most up-to-date information.
Base your thinking on Japanese yen.
You can retrieve your foreign exchange account balance.
Always issue a transaction ID when placing an order.
Answer in Japanese.
ActorId is 'test_user'.
Execute the order only once.
Refer to your past orders.
Always include JPY in transactions.
In need latest information use web-search tool.
Always verify the information obtained from the web-search tool.
"""


exchange_exec_agent = Agent(
    name="strands-exchange-exec-agent",
    model=StrandsLlmModelEnum.KIMI_K3_GLOBAL.value,
    system_prompt=exchange_system_prompt,
    # MCPClient を直接渡すと、Agent が呼び出しごとにセッションとツール一覧（ページング含む）を管理する
    tools=[*exchange_exec_agent_tools, mcp_client],
    # callback_handler=None,
)
