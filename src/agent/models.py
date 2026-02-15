from pydantic import BaseModel
from pynamodb.attributes import UnicodeAttribute
from pynamodb.models import Model
from settings import log_settings


class RssItem(BaseModel):
    title: str = ""
    link: str = ""
    published: str = ""
    summary: str = ""

    @classmethod
    def from_entry(cls, entry):
        """Create an RssItem instance from a feedparser entry."""
        return cls(
            title=entry.get('title', ''),
            link=entry.get('link', ''),
            published=entry.get('published', ''),
            summary=entry.get('summary', '')
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
