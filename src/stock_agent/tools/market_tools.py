import yfinance as yf
from logger import logger
from schemas import MarketIndexEnum
from strands import tool


@tool
def get_market_status(market_index: MarketIndexEnum) -> dict:
    """
    Get the current status of the specified market index.

    Ref. https://ranaroussi.github.io/yfinance/reference/yfinance.market.html

    Args:
        market_index (MarketIndexEnum): The market index to fetch information for.

    Returns:
        dict: A dictionary containing market information.
    """
    logger.info(
        f"Fetching general market information for market index: {market_index.value}",
        extra={"market_index": market_index.value},
    )
    market = yf.Market(market_index.value)

    return market.status


@tool
def get_market_summary(market_index: MarketIndexEnum) -> dict:
    """
    Get the summary information of the specified market index.

    Ref. https://ranaroussi.github.io/yfinance/reference/yfinance.market.html

    Args:
        market_index (MarketIndexEnum): The market index to fetch information for.

    Returns:
        dict: A dictionary containing market summary information.
    """
    logger.info(
        f"Fetching market summary for market index: {market_index.value}",
        extra={"market_index": market_index.value},
    )
    market = yf.Market(market_index.value)

    return market.summary
