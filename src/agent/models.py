from pydantic import BaseModel


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
