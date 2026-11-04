from datetime import datetime
from zoneinfo import ZoneInfo


def get_timestamp() -> str:
    return datetime.now(ZoneInfo("Asia/Tokyo")).isoformat()
