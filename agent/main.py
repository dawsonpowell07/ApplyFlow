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
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, StreamingResponse
from pydantic import BaseModel
from strands_tools import http_request
from settings import get_settings

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


# Define custom Agent class
class ApplyFlowAgent(Agent):
    def __init__(self, system_prompt, model, session_manager, session_id):
        """
        Initialize ApplyFlowAgent with session management.

        Args:
            system_prompt: System prompt for the agent
            model: The LLM model to use
            session_manager: Session manager (FileSessionManager or S3SessionManager)
            session_id: session/thread identifier
        """
        super().__init__(
            system_prompt=system_prompt,
            model=model,
            tools=[
                job_analytics_assistant,
                application_management_assistant,
                resume_assistant,
                http_request,
            ],
            session_manager=session_manager,
            conversation_manager=conversation_manager,
        )
        self.session_id = session_id


app = FastAPI(title="ApplyFlow API")

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PromptRequest(BaseModel):
    prompt: str
    session_id: str


@app.post('/agent')
async def run_agent(request: PromptRequest):
    """Endpoint to interact with the ApplyFlow agent."""
    logger.info(f"POST /agent - session: {request.session_id}")

    prompt = request.prompt
    session_id = request.session_id

    if not prompt:
        raise HTTPException(status_code=400, detail="No prompt provided")

    try:
        session_manager = get_session_manager(session_id=session_id)
        agent = ApplyFlowAgent(
            model=model,
            system_prompt=ORCHESTRATOR_PROMPT,
            session_manager=session_manager,
            session_id=session_id
        )

        response = agent(prompt)
        return PlainTextResponse(content=str(response))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error in /agent (session {session_id}): {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def run_agent_and_stream_response(prompt: str, session_id: str):
    """Stream agent responses back to the client."""
    try:
        session_manager = get_session_manager(session_id=session_id)
        orchestrator = Agent(
            model=model,
            system_prompt=ORCHESTRATOR_PROMPT,
            tools=[
                job_analytics_assistant,
                application_management_assistant,
                resume_assistant],
            session_manager=session_manager,
            conversation_manager=conversation_manager
        )

        async for item in orchestrator.stream_async(prompt):
            if "data" in item:
                yield item['data']

    except Exception as e:
        logger.error(
            f"Error in streaming (session {session_id}): {str(e)}", exc_info=True)
        raise


@app.post('/agent-streaming')
async def run_agent_streaming(request: PromptRequest):
    """Endpoint to interact with the ApplyFlow agent with streaming responses."""
    logger.info(f"POST /agent-streaming - session: {request.session_id}")

    try:
        prompt = request.prompt
        session_id = request.session_id

        if not prompt:
            raise HTTPException(status_code=400, detail="No prompt provided")

        return StreamingResponse(
            run_agent_and_stream_response(prompt, session_id),
            media_type="text/plain"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error in /agent-streaming (session {request.session_id}): {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/get_conversations")
def get_conversations(session_id: str):
    """Get conversation history for a session."""
    logger.info(f"GET /get_conversations - session: {session_id}")

    try:
        session_manager = get_session_manager(session_id=session_id)
        agent = ApplyFlowAgent(
            model=model,
            system_prompt=ORCHESTRATOR_PROMPT,
            session_manager=session_manager,
            session_id=session_id
        )

        return {"messages": agent.messages}
    except Exception as e:
        logger.error(
            f"Error in /get_conversations (session {session_id}): {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Error getting conversations: {str(e)}"
        )


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ApplyFlow Agent",
        "session_storage": "s3" if settings.USE_S3_SESSION_STORAGE else "local_file"
    }


# Example usage
# if __name__ == "__main__":
#     # Test the orchestrator with different types of queries
#     thread_id = "1"
#     session_manager = get_session_manager(session_id=thread_id)
#     agent = ApplyFlowAgent(
#         model=model,
#         system_prompt=ORCHESTRATOR_PROMPT,
#         session_manager=session_manager,
#         user_id=thread_id
#     )
#     while True:
#         query = input("Query: ")
#         if query == "q":
#             quit()
#         agent(query)
#         print()
