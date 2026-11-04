import yfinance as yf
from db.balance_db import OrderHistoryModel, UserBalanceModel
from logger import logger
from nanoid import generate
from schemas import (
    CurrencyEnum,
    ExchangeIndexEnum,
    FxBalance,
    OrderRequest,
    OrderResponse,
)
from services.exchange_service import exec_order
from strands import tool


@tool
def get_exchange_info(ticker: ExchangeIndexEnum) -> dict:
    """
    Get exchange information for the given ticker symbol.

    Ref. https://ranaroussi.github.io/yfinance/reference/api/yfinance.Ticker.html#yfinance.Ticker

    Args:
        ticker (ExchangeIndexEnum): The exchange ticker symbol.

    Returns:
        dict: A dictionary containing stock information.
    """
    logger.info(
        f"Fetching exchange information for ticker: {ticker}", extra={"ticker": ticker}
    )
    exchange = yf.Ticker(ticker.value)
    return exchange.info


@tool
def get_fx_balance(actor_id: str) -> FxBalance:
    """
    Get the current foreign exchange balance.

    Args:
        actor_id (str): The user ID for which to fetch the FX balance.

    Returns:
        FxBalance: An object containing the FX balance information.
    """
    # This is a placeholder implementation. Replace with actual logic to fetch FX balance.
    balance = UserBalanceModel.get(
        actor_id
    )  # Replace "actor_id" with the actual user ID

    return balance.to_fx_balance()


@tool
def generate_transaction_id() -> str:
    """
    Generate a unique transaction ID.

    Returns:
        str: A unique transaction ID.
    """
    transaction_id = generate()
    logger.info(
        f"Generated transaction ID: {transaction_id}",
        extra={"transactionId": transaction_id},
    )
    return transaction_id


@tool
def order(
    actor_id: str,
    transaction_id: str,
    sell: CurrencyEnum,
    buy: CurrencyEnum,
    buy_quantity: int,
) -> OrderResponse:
    """
    Place an order for the given request.

    Args:
        actor_id (str): The user ID placing the order.
        transaction_id (str): The transaction ID for the order.
        sell (CurrencyEnum): The currency to sell.
        buy (CurrencyEnum): The currency to buy.
        buy_quantity (int): The quantity to order.

    Returns:
        OrderResponse: An object containing the order confirmation or status.
    """
    # This is a placeholder implementation. Replace with actual logic to place an order.
    logger.info(f"Placing order for user: {actor_id}", extra={"actorId": actor_id})
    request = OrderRequest(
        actor_id=actor_id,
        transaction_id=transaction_id,
        sell=sell,
        buy=buy,
        buy_quantity=buy_quantity,
    )

    return exec_order(request)


@tool
def get_order_histories(actor_id: str) -> list[OrderHistoryModel]:
    """
    Get the order histories for the given user ID.

    Args:
        actor_id (str): The user ID for which to fetch order histories.

    Returns:
        list[OrderHistoryModel]: A list of order history records. Limited to the 10 most recent entries.
    """
    histories = list(
        OrderHistoryModel.actor_id_index.query(
            actor_id, scan_index_forward=False, limit=10
        )
    )
    logger.info(
        f"Fetched order histories for user: {actor_id}",
        extra={"actorId": actor_id, "historiesCount": len(histories)},
    )
    return histories
