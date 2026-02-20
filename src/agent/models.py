from pydantic import BaseModel
from pynamodb.attributes import MapAttribute, NumberAttribute, UnicodeAttribute
from pynamodb.models import Model
from settings import log_settings


class RssItem(BaseModel):
    title: int = ""
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


class MetadataAttribute(MapAttribute):
    InputTokens = NumberAttribute()
    OutputTokens = NumberAttribute()
    TotalTokens = NumberAttribute()

    @classmethod
    def from_dict(cls, data: dict):
        """Create a MetadataAttribute instance from a dictionary."""
        return cls(
            InputTokens=data.get("inputTokens", 0),
            OutputTokens=data.get("outputTokens", 0),
            TotalTokens=data.get("totalTokens", 0),
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
    Metadata = MetadataAttribute(null=True)
