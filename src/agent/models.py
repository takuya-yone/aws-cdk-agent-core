from enum import Enum

from pydantic import BaseModel
from pynamodb.attributes import MapAttribute, NumberAttribute, UnicodeAttribute
from pynamodb.models import Model
from settings import log_settings
from strands.types.event_loop import Usage


class RssItem(BaseModel):
    title: str = ""
    link: str = ""
    published: str = ""
    summary: str = ""

    @classmethod
    def from_entry(cls, entry):
        """Create an RssItem instance from a feedparser entry."""
        return cls(
            title=entry.get("title", ""),
            link=entry.get("link", ""),
            published=entry.get("published", ""),
            summary=entry.get("summary", ""),
        )


class UsageAttribute(MapAttribute):
    InputTokens = NumberAttribute()
    OutputTokens = NumberAttribute()
    TotalTokens = NumberAttribute()

    @classmethod
    def from_usage(cls, usage: Usage):
        """Create a MetadataAttribute instance from a Usage object."""
        return cls(
            InputTokens=usage.get("inputTokens", 0),
            OutputTokens=usage.get("outputTokens", 0),
            TotalTokens=usage.get("totalTokens", 0),
        )


class AgentCoreInvokeLogModel(Model):
    """
    DynamoDB model for logging agent invocations.
    """

    class Meta:
        table_name = log_settings.log_table_name

    InvocationId = UnicodeAttribute()
    ActorId = UnicodeAttribute(hash_key=True)
    Timestamp = UnicodeAttribute(range_key=True)
    SessionId = UnicodeAttribute()
    Input = UnicodeAttribute()
    Output = UnicodeAttribute(null=True)
    Usage = UsageAttribute(null=True)
    Latency = NumberAttribute(null=True)


class EventTypeEnum(Enum):
    messageStart = "messageStart"  # noqa: N815
    contentBlockStart = "contentBlockStart"  # noqa: N815
    contentBlockDelta = "contentBlockDelta"  # noqa: N815
    contentBlockStop = "contentBlockStop"  # noqa: N815
    messageStop = "messageStop"  # noqa: N815
    metadata = "metadata"


class InvocationRequestModel(BaseModel):
    prompt: str
    actor_id: str | None = None
    session_id: str | None = None


class InvocationResponseModel(BaseModel):
    event: EventTypeEnum
    data: str
