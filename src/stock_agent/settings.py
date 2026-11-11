from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    agent_core_gateway_url: str = Field()
    fx_balance_history_table_name: str = Field()
    fx_balance_table_name: str = Field()
    fx_order_history_table_name: str = Field()
    fx_order_summary_bucket_name: str = Field()
    user_notification_topic_arn: str = Field()


settings = Settings()


# 環境変数から設定を読み込む場合
# export AGENT_CORE_GATEWAY_URL="https://stockagentcoregateway-xxxxxxx.gateway.bedrock-agentcore.ap-northeast-1.amazonaws.com/mcp"
# export FX_BALANCE_HISTORY_TABLE_NAME="FxBalanceHistoryTable"
# export FX_BALANCE_TABLE_NAME="FxBalanceTable"
# export FX_ORDER_HISTORY_TABLE_NAME="FxOrderHistoryTable"
# export FX_ORDER_SUMMARY_BUCKET_NAME="fx-order-summary-bucket"
# export USER_NOTIFICATION_TOPIC_ARN="arn:aws:sns:ap-northeast-1:123456789012:StockAgentUserNotificationTopic"
