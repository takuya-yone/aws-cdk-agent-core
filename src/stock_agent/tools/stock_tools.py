import yfinance as yf
from logger import logger
from schemas import FinancialStatementEnum
from strands import tool


@tool
def get_stock_info(ticker: str) -> dict:
    """
    Get stock information for the given ticker symbol.

    Ref. https://ranaroussi.github.io/yfinance/reference/api/yfinance.Ticker.html#yfinance.Ticker

    Args:
        ticker (str): The stock ticker symbol.

    Returns:
        dict: A dictionary containing stock information.
    """
    logger.info(
        f"Fetching stock information for ticker: {ticker}", extra={"ticker": ticker}
    )
    stock = yf.Ticker(ticker)
    return stock.info


@tool
def get_stock_financial_statement(
    ticker: str, statement: FinancialStatementEnum
) -> dict:
    """
    Get the specified financial statement for the given ticker symbol.

    Ref. https://ranaroussi.github.io/yfinance/reference/api/yfinance.Ticker.html#yfinance.Ticker

    Args:
        ticker (str): The stock ticker symbol.
        statement (FinancialStatementEnum): The financial statement to fetch.

    Returns:
        dict: A dictionary containing the requested financial statement information.
    """
    logger.info(
        f"Fetching {statement.value} for ticker: {ticker}",
        extra={"ticker": ticker, "statement": statement.value},
    )
    stock = yf.Ticker(ticker)
    if statement == FinancialStatementEnum.BALANCE_SHEET:
        return stock.get_balance_sheet(as_dict=True, pretty=True)
    elif statement == FinancialStatementEnum.INCOME_STATEMENT:
        return stock.get_income_stmt(as_dict=True, pretty=True)
    elif statement == FinancialStatementEnum.CASH_FLOW:
        return stock.get_cash_flow(as_dict=True, pretty=True)
    else:
        logger.error(f"Unsupported financial statement: {statement.value}")
        return {}
