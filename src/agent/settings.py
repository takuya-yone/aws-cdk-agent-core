
import json
import os
from functools import cached_property

from aws_lambda_powertools.utilities import parameters
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
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
    model_config = SettingsConfigDict(frozen=False)

    tavily_secret_name: str

    @cached_property
    def tavily_api_key(self) -> str:
        if is_local():
            return os.getenv("TAVILY_SECRET_KEY")
        secret = json.loads(parameters.get_secret(self.tavily_secret_name, max_age=300))
        return secret.get("TAVILY_API_KEY")

model_settings = ModelSettings()
model = model_settings.get_model()
