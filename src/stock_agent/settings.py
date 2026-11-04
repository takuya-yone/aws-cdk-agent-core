from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    agent_core_gateway_url: str = Field()
    fx_balance_history_table_name: str = Field()
    fx_balance_table_name: str = Field()
    fx_order_history_table_name: str = Field()
    fx_order_summary_bucket_name: str = Field()


settings = Settings()


# 環境変数から設定を読み込む場合
# export AGENT_CORE_GATEWAY_URL="https://aaaaa"
