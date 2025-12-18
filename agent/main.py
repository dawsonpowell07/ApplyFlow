import logging
import boto3

from strands import Agent, tool
from strands.models.gemini import GeminiModel
from strands.models.openai import OpenAIModel
from subagents.analytics_agent import job_analytics_assistant
from subagents.application_management_agent import application_management_assistant
from subagents.resume_agent import resume_assistant
from strands.session.file_session_manager import FileSessionManager
from strands.session.s3_session_manager import S3SessionManager
from strands.agent.conversation_manager import SlidingWindowConversationManager
from fastapi import FastAPI, HTTPException
from fastapi.responses import PlainTextResponse, StreamingResponse
from pydantic import BaseModel
from strands_tools import http_request
from settings import get_settings
from ag_ui_strands import StrandsAgent, create_strands_app

# Configure logging
logger = logging.getLogger("applyflow-agent")
logger.setLevel(logging.INFO)

logging.basicConfig(
    format="%(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler()]
)

settings = get_settings()

logger.info("ApplyFlow Agent Service Starting")

# Define the orchestrator system prompt with clear tool selection guidance
ORCHESTRATOR_PROMPT = """
You are ApplyFlow Assistant, an intelligent job application management system.
You coordinate specialized agents to help users manage their job search effectively.

Route queries to the appropriate specialized agent:

- For analytics, insights, trends, success rates, or data analysis → Use job_analytics_assistant
- For creating, viewing, updating, deleting, or organizing applications → Use application_management_assistant
- For resume tips, tailoring, optimization, or job description analysis → Use resume_assistant
- For simple greetings or questions not requiring specialized knowledge → Answer directly

Always select the most appropriate tool based on the user's query to provide
the best possible assistance.
"""


# model = GeminiModel(
#     client_args={
#         "api_key": settings.GOOGLE_API_KEY,
#     },
#     model_id="gemini-2.5-flash-lite",
# )

model = OpenAIModel(
    client_args={
        "api_key":  settings.OPENAI_API_KEY,
    },
    # **model_config
    model_id="gpt-5-mini",
)

conversation_manager = SlidingWindowConversationManager(
    window_size=20,  # Maximum number of messages to keep
    # Enable truncating the tool result when a message is too large for the model's context window
    should_truncate_results=True,
)


def get_session_manager(session_id: str):
    """
    Get the appropriate session manager based on settings.

    Returns FileSessionManager in dev mode, S3SessionManager in production.
    """
    if settings.USE_S3_SESSION_STORAGE:
        boto_session = boto3.Session(region_name=settings.AWS_REGION)
        return S3SessionManager(
            session_id=session_id,
            bucket=settings.S3_SESSION_BUCKET,
            boto_session=boto_session,
        )
    else:
        return FileSessionManager(session_id=session_id)


agent = Agent(model=model, system_prompt=ORCHESTRATOR_PROMPT, tools=[
              job_analytics_assistant, resume_assistant, application_management_assistant])

# Wrap with AG-UI integration
agui_agent = StrandsAgent(
    agent=agent,
    name="strands_agent",
)
# Create the FastAPI app
app = create_strands_app(agui_agent, "/")
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
