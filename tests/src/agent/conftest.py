"""Pytest configuration for agent tests.

Sets required environment variables and mocks external dependencies
before any agent modules are imported.
"""

import os
import sys
from unittest.mock import MagicMock

# Set environment variables before any imports
os.environ.setdefault("MODEL_ID", "test-model-id")
os.environ.setdefault("KB_MODEL_ID", "test-kb-model-id")
os.environ.setdefault("TAVILY_SECRET_NAME", "test-secret")
os.environ.setdefault("MEMORY_ID", "test-memory-id")
os.environ.setdefault("BEDROCK_KB_ID", "test-kb-id")
os.environ.setdefault("BEDROCK_ESTATE_KB_ID", "test-estate-kb-id")
os.environ.setdefault("LOG_TABLE_NAME", "test-log-table")
os.environ.setdefault("TAGOSAKU_MODEL_ID", "test-tagosaku-model-id")

# Mock sub_agents module to avoid AWS credential requirements at import time
sys.modules["sub_agents"] = MagicMock()
sys.modules["agent_tools"] = MagicMock()
