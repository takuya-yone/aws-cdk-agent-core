from enum import Enum

from pydantic import BaseModel
from strands.models import BedrockModel


class StrandsLlmModelEnum(Enum):
    SONNET_5_GLOBAL = BedrockModel(
        model_id="global.anthropic.claude-sonnet-5",
        region_name="ap-northeast-1",
    )
    KIMI_K3_GLOBAL = BedrockModel(
        model_id="global.moonshotai.kimi-k3",
        region_name="ap-northeast-1",
    )
    GROK_47_GLOBAL = BedrockModel(
        model_id="global.xai.grok-4.7",
        region_name="ap-northeast-1",
    )
    NOVA_2_LITE_GLOBAL = BedrockModel(
        model_id="global.amazon.nova-2-lite-v1:0",
        region_name="ap-northeast-1",
    )
    NOVA_PRO_APAC = BedrockModel(
        model_id="apac.amazon.nova-pro-v1:0",
        region_name="ap-northeast-1",
    )


class MarketIndexEnum(Enum):
    US = "US"
    GB = "GB"
    ASIA = "ASIA"
    EUROPE = "EUROPE"
    RATES = "RATES"
    COMMODITIES = "COMMODITIES"
    CURRENCIES = "CURRENCIES"
    CRYPTOCURRENCIES = "CRYPTOCURRENCIES"


class FinancialStatementEnum(Enum):
    BALANCE_SHEET = "BALANCE_SHEET"
    INCOME_STATEMENT = "INCOME_STATEMENT"
    CASH_FLOW = "CASH_FLOW"


class ExchangeIndexEnum(Enum):
    USDJPY = "USDJPY=X"
    EURJPY = "EURJPY=X"
    GBPJPY = "GBPJPY=X"


class CurrencyEnum(Enum):
    JPY = "JPY"
    EUR = "EUR"
    USD = "USD"
    GBP = "GBP"


class FxBalance(BaseModel):
    JPY: int
    EUR: int
    USD: int
    GBP: int


class OrderRequest(BaseModel):
    actor_id: str
    transaction_id: str
    sell: CurrencyEnum
    buy: CurrencyEnum
    buy_quantity: int


class OrderResponse(BaseModel):
    transaction_id: str


class FxBalanceRequest(BaseModel):
    actor_id: str
