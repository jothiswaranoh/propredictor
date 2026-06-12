# app/schemas package
from typing import Annotated
from datetime import datetime
from zoneinfo import ZoneInfo
from pydantic import PlainSerializer

ISTDateTime = Annotated[
    datetime,
    PlainSerializer(
        lambda dt: (
            dt.replace(tzinfo=ZoneInfo("UTC")) if dt.tzinfo is None else dt
        ).astimezone(ZoneInfo("Asia/Kolkata")).isoformat(),
        return_type=str
    )
]
