import math

import yfinance as yf
from db.balance_db import (
    OrderHistoryModel,
    UserBalanceHistoryModel,
    UserBalanceModel,
)
from logger import logger
from schemas import (
    CurrencyEnum,
    ExchangeIndexEnum,
    OrderRequest,
    OrderResponse,
)
from services.common import get_timestamp


def exec_order(req: OrderRequest) -> OrderResponse:
    """
    Execute a currency exchange order.

    Args:
        req (OrderRequest): The order request containing user ID, transaction ID, sell currency, buy currency, and quantity.

    Returns:
        OrderResponse: The response containing the transaction ID and timestamp.
    """
    logger.info(
        f"Executing order for user: {req.actor_id}, sell: {req.sell}, buy: {req.buy}, buy_quantity: {req.buy_quantity}"
    )

    new_balance = UserBalanceModel.get(req.actor_id)

    # buy_quantity is in the buy currency; convert it to the sell currency via JPY

    # if not includes jpy throw error
    if req.sell != CurrencyEnum.JPY and req.buy != CurrencyEnum.JPY:
        raise ValueError("Either sell or buy currency must be JPY")

    # balances are integers: round the sell amount up (after trimming float noise) so the user never underpays
    sell_quantity = math.ceil(
        round(_convert_quantity(req.buy_quantity, req.buy, req.sell), 6)
    )
    logger.info(f"Sell quantity: {sell_quantity} {req.sell.value}")

    if req.sell == CurrencyEnum.JPY:
        new_balance.Balance.JPY -= sell_quantity
    elif req.sell == CurrencyEnum.USD:
        new_balance.Balance.USD -= sell_quantity
    elif req.sell == CurrencyEnum.EUR:
        new_balance.Balance.EUR -= sell_quantity
    elif req.sell == CurrencyEnum.GBP:
        new_balance.Balance.GBP -= sell_quantity

    # if minus balance, raise an error
    if (
        new_balance.Balance.JPY < 0
        or new_balance.Balance.USD < 0
        or new_balance.Balance.EUR < 0
        or new_balance.Balance.GBP < 0
    ):
        raise ValueError("Insufficient balance")

    if req.buy == CurrencyEnum.JPY:
        new_balance.Balance.JPY += req.buy_quantity
    elif req.buy == CurrencyEnum.USD:
        new_balance.Balance.USD += req.buy_quantity
    elif req.buy == CurrencyEnum.EUR:
        new_balance.Balance.EUR += req.buy_quantity
    elif req.buy == CurrencyEnum.GBP:
        new_balance.Balance.GBP += req.buy_quantity

    _save_balance(req.actor_id, new_balance, req.transaction_id)
    _save_user_balance_history(req.actor_id, new_balance, req.transaction_id)
    _save_order_history(
        req.actor_id,
        req.transaction_id,
        f"{req.sell.value}/{req.buy.value}",
        req.buy_quantity,
        _get_jpy_rate(req.buy),
    )

    res = OrderResponse(transaction_id=req.transaction_id)
    return res


def _save_order_history(
    actor_id: str, transaction_id: str, ticker: str, quantity: float, price: float
):
    """
    Save the order history to the database.

    Args:
        actor_id (str): The user ID associated with the order.
        transaction_id (str): The transaction ID for the order.
        ticker (str): The ticker symbol of the asset.
        quantity (float): The quantity of the asset.
        price (float): The price of the asset.
    """
    logger.info(
        f"Saving order history for actor_id={actor_id}, transaction_id={transaction_id}"
    )
    _timestamp = get_timestamp()
    history = OrderHistoryModel(
        TransactionId=transaction_id,
        ActorId=actor_id,
        Timestamp=_timestamp,
        Ticker=ticker,
        Quantity=quantity,
        Price=price,
    )
    history.save()
    logger.info(f"Order history created: {history.TransactionId}")


def _save_user_balance_history(
    actor_id: str, new_balance: UserBalanceModel, transaction_id: str
):
    """
    Save the user's balance history to the database.

    Args:
        actor_id (str): The user ID for which to save the balance history.
        new_balance (UserBalanceModel): The current balance object.
        transaction_id (str): The transaction ID associated with this balance update.
        timestamp (str): The timestamp of the balance snapshot.
    """
    logger.info(
        f"Saving user balance history for actor_id={actor_id}, transaction_id={transaction_id}"
    )
    timestamp = get_timestamp()
    history = UserBalanceHistoryModel(
        ActorId=actor_id,
        Timestamp=timestamp,
        TransactionId=transaction_id,
        Balance={
            "JPY": int(new_balance.Balance.JPY),
            "USD": int(new_balance.Balance.USD),
            "EUR": int(new_balance.Balance.EUR),
            "GBP": int(new_balance.Balance.GBP),
        },
        TotalJpyValue=int(_calc_jpy_value(new_balance)),
    )
    history.save()


def _get_jpy_rate(currency: CurrencyEnum) -> float:
    """
    Get the JPY value of one unit of the given currency.

    Args:
        currency (CurrencyEnum): The currency to look up.

    Returns:
        float: JPY per one unit of the currency (1.0 for JPY).
    """
    if currency == CurrencyEnum.JPY:
        return 1.0
    return _get_last_price(ExchangeIndexEnum[f"{currency.value}JPY"])


def _convert_quantity(
    quantity: float, from_currency: CurrencyEnum, to_currency: CurrencyEnum
) -> float:
    """
    Convert an amount from one currency to another via JPY.

    Args:
        quantity (float): The amount in from_currency.
        from_currency (CurrencyEnum): The currency of the amount.
        to_currency (CurrencyEnum): The currency to convert to.

    Returns:
        float: The equivalent amount in to_currency.
    """
    if from_currency == to_currency:
        return quantity
    return quantity * _get_jpy_rate(from_currency) / _get_jpy_rate(to_currency)


def _save_balance(actor_id: str, new_balance: UserBalanceModel, transaction_id: str):
    """
    Save the updated user balance to the database.

    Args:
        actor_id (str): The user ID for which to save the balance.
        new_balance (UserBalanceModel): The updated balance object.
        transaction_id (str): The transaction ID associated with this balance update.
    """
    logger.info(
        f"Saving user balance for actor_id={actor_id}, transaction_id={transaction_id}"
    )
    balance = UserBalanceModel.get(actor_id)
    balance.Balance.JPY = int(new_balance.Balance.JPY)
    balance.Balance.USD = int(new_balance.Balance.USD)
    balance.Balance.EUR = int(new_balance.Balance.EUR)
    balance.Balance.GBP = int(new_balance.Balance.GBP)
    balance.LatestTransactionId = transaction_id
    balance.save()


def _calc_jpy_value(balance: UserBalanceModel):
    """
    Calculate the total value of the user's balance in JPY.

    Args:
        balance (UserBalanceModel): The user's balance object.

    Returns:
        int: The total value of the balance in JPY.
    """
    jpy_value = balance.Balance.JPY

    jpy_value += balance.Balance.USD * _get_last_price(ExchangeIndexEnum.USDJPY)
    jpy_value += balance.Balance.EUR * _get_last_price(ExchangeIndexEnum.EURJPY)
    jpy_value += balance.Balance.GBP * _get_last_price(ExchangeIndexEnum.GBPJPY)

    return int(jpy_value)


def _get_last_price(ticker: ExchangeIndexEnum) -> float:
    """
    Get the last price for the given exchange ticker.

    Args:
        ticker (ExchangeIndexEnum): The exchange ticker symbol.

    Returns:
        float: The last price of the exchange ticker.
    """
    exchange = yf.Ticker(ticker.value).fast_info["lastPrice"]
    return exchange
