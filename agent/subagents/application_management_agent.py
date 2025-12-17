from strands import Agent, tool
from strands_tools import http_request
from strands.models.gemini import GeminiModel
from settings import get_settings

settings = get_settings()


def get_model():
    """Initialize and return the Gemini model for the agent."""
    return GeminiModel(
        client_args={
            "api_key": settings.GOOGLE_API_KEY,
        },
        model_id="gemini-2.5-flash-lite",
    )


APPLICATION_MANAGEMENT_PROMPT = """
You are a specialized application management assistant.
Your role is to:
- Help create new job applications with all necessary details
- Retrieve and display application information
- Update application status and details
- Delete or archive applications
- Organize applications by status, date, company, or other criteria
- Track deadlines and important dates
- Manage application-related documents and links

Be precise and thorough when handling application data. Always confirm actions
that modify or delete data.
"""


@tool
def application_management_assistant(query: str) -> str:
    """
    Handle CRUD operations for job applications including creating, reading,
    updating, and deleting application records.

    Args:
        query: A request to create, view, update, delete, or organize job applications

    Returns:
        Confirmation of the action taken or the requested application data
    """
    try:
        management_agent = Agent(
            model=get_model(),
            system_prompt=APPLICATION_MANAGEMENT_PROMPT,
            tools=[http_request]
        )

        response = management_agent(query)
        return str(response)
    except Exception as e:
        return f"Error in application management assistant: {str(e)}"
