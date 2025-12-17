from strands import Agent, tool
from strands.models.gemini import GeminiModel
from subagents.analytics_agent import job_analytics_assistant
from subagents.application_management_agent import application_management_assistant
from subagents.resume_agent import resume_assistant
from strands.session.file_session_manager import FileSessionManager
from strands.agent.conversation_manager import SlidingWindowConversationManager
from fastapi import FastAPI, HTTPException
from fastapi.responses import PlainTextResponse, StreamingResponse
from pydantic import BaseModel
from strands_tools import http_request
from settings import get_settings

settings = get_settings()
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

# Initialize the model for the orchestrator
model = GeminiModel(
    client_args={
        "api_key": settings.GOOGLE_API_KEY,
    },
    model_id="gemini-2.5-flash-lite",
)

conversation_manager = SlidingWindowConversationManager(
    window_size=20,  # Maximum number of messages to keep
    # Enable truncating the tool result when a message is too large for the model's context window
    should_truncate_results=True,
)

app = FastAPI(title="ApplyFlow API")

# System prompt for the ApplyFlow agent


class PromptRequest(BaseModel):
    prompt: str
    thread_id: str


@app.post('/agent')
async def run_agent(request: PromptRequest):
    """Endpoint to interact with the ApplyFlow agent."""
    prompt = request.prompt
    thread_id = request.thread_id

    if not prompt:
        raise HTTPException(status_code=400, detail="No prompt provided")

    session_manager = FileSessionManager(session_id=thread_id)

    try:
        orchestrator = Agent(
            model=model,
            system_prompt=ORCHESTRATOR_PROMPT,
            tools=[
                job_analytics_assistant,
                application_management_assistant,
                resume_assistant,
                http_request,
            ],
            session_manager=session_manager,
            conversation_manager=conversation_manager
        )
        response = orchestrator(prompt)
        content = str(response)
        return PlainTextResponse(content=content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def run_agent_and_stream_response(prompt: str, thread_id: str):
    """Stream agent responses back to the client."""
    is_ready = False

    @tool
    def ready_to_respond():
        """Indicate that the agent is ready to provide a response."""
        nonlocal is_ready
        is_ready = True
        return "Ok - continue with your response!"

    session_manager = FileSessionManager(session_id=thread_id)

    orchestrator = Agent(
        model=model,
        system_prompt=ORCHESTRATOR_PROMPT,
        tools=[
            job_analytics_assistant,
            application_management_assistant,
            resume_assistant,
            http_request,
            ready_to_respond
        ],
        session_manager=session_manager,
        conversation_manager=conversation_manager
    )

    async for item in orchestrator.stream_async(prompt):
        if not is_ready:
            continue
        if "data" in item:
            yield item['data']


@app.post('/agent-streaming')
async def run_agent_streaming(request: PromptRequest):
    """Endpoint to interact with the ApplyFlow agent with streaming responses."""
    try:
        prompt = request.prompt
        thread_id = request.thread_id

        if not prompt:
            raise HTTPException(status_code=400, detail="No prompt provided")

        return StreamingResponse(
            run_agent_and_stream_response(prompt, thread_id),
            media_type="text/plain"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Example usage
# if __name__ == "__main__":
#     # Test the orchestrator with different types of queries
#     thread_id = "1"
#     session_manager = FileSessionManager(session_id=thread_id)
#     orchestrator = Agent(
#         model=model,
#         system_prompt=ORCHESTRATOR_PROMPT,
#         tools=[
#             job_analytics_assistant,
#             application_management_assistant,
#             resume_assistant,
#             http_request,
#         ],
#         session_manager=session_manager,
#         conversation_manager=conversation_manager
#     )
#     while True:
#         query = input("Query: ")
#         if query == "q":
#             quit()
#         orchestrator(query)
#         print()
