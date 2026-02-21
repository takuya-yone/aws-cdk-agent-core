import logging

from aws_lambda_powertools import Logger


class EndpointFilter(logging.Filter):
    def __init__(self, excluded_endpoints: list[str]) -> None:
        self.excluded_endpoints = excluded_endpoints

    def filter(self, record: logging.LogRecord) -> bool:
        """
        Filter関数
        Args:
            record: ログレコード
        Returns:
            bool: ログを出力するかどうか
        """
        return (
            record.args
            and len(record.args) >= 3
            and record.args[2] not in self.excluded_endpoints
        )


# uvicornのアクセスログから特定のエンドポイントを除外するためのフィルタを追加
excluded_endpoints = ["/ping"]
logging.getLogger("uvicorn.access").addFilter(EndpointFilter(excluded_endpoints))

# FastAPI用のロガーを作成
logger = Logger()
