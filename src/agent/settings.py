
import json
import os
from functools import cached_property

from aws_lambda_powertools.utilities import parameters
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from strands.models import BedrockModel

# .envファイルの内容を読み込む
load_dotenv('.env')

def is_local() -> bool:
    return os.getenv("IS_LOCAL") == "True"

class ModelSettings(BaseSettings):
    model_id: str
    max_tokens: int = 2048
    temperature: float = 0.7
    top_p: float = 0.9

    def get_model(self) -> BedrockModel:
        return BedrockModel(
            model_id=self.model_id,
        )


class TavilySettings(BaseSettings):
    tavily_secret_name: str

    @cached_property
    def tavily_api_key(self) -> str:
        secret = json.loads(parameters.get_secret(self.tavily_secret_name, max_age=300))
        return secret.get("TAVILY_API_KEY")


class AwsRssSettings(BaseSettings):
    rss_default_items: int = 10
    rss_max_items: int = 100
    rss_url: str = "https://aws.amazon.com/about-aws/whats-new/recent/feed/"


class AgentCoreMemorySettings(BaseSettings):
    memory_id: str


class KnowledgeBaseSettings(BaseSettings):
    model_id: str
    bedrock_kb_id: str
    kb_result_nums: int = 10


class LogSettings(BaseSettings):
    log_table_name: str


model_settings = ModelSettings()
tavily_settings = TavilySettings()
aws_rss_settings = AwsRssSettings()
memory_settings = AgentCoreMemorySettings()
knowledge_base_settings = KnowledgeBaseSettings()
log_settings = LogSettings()

