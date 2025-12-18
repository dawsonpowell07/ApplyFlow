from typing import Dict, Any
from strands import Agent, tool
from strands_tools import http_request
from strands.models.gemini import GeminiModel
from strands.models.openai import OpenAIModel
from settings import get_settings

settings = get_settings()


def get_model():
    """Initialize and return the Gemini model for the agent."""
    # return GeminiModel(
    #     client_args={
    #         "api_key": settings.GOOGLE_API_KEY,
    #     },
    #     model_id="gemini-2.5-flash-lite",
    # )

    return OpenAIModel(
        client_args={
            "api_key":  settings.OPENAI_API_KEY,
        },
        # **model_config
        model_id="gpt-5-mini",
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
            tools=[create_application, get_application,
                   update_application, delete_application]
        )

        response = management_agent(query)
        return str(response)
    except Exception as e:
        return f"Error in application management assistant: {str(e)}"


@tool
def create_application(
    user_id: str, company_name: str, job_title: str, status: str
) -> Dict[str, Any]:
    """
    s creating a new job application.
    """
    print(
        f": Creating application for user {user_id}: {company_name} - {job_title}"
    )
    return {
        "id": "-app-id-123",
        "user_id": user_id,
        "company_name": company_name,
        "job_title": job_title,
        "status": status,
    }


@tool
def get_application(user_id: str, application_id: str) -> Dict[str, Any]:
    """
    s retrieving a job application by its ID.
    """
    print(
        f": Retrieving application {application_id} for user {user_id}"
    )
    return {
        "id": application_id,
        "user_id": user_id,
        "company_name": " Company",
        "job_title": " Job Title",
        "status": "Applied",
    }


@tool
def update_application(
    user_id: str, application_id: str, updates: Dict[str, Any]
) -> Dict[str, Any]:
    """
    s updating an existing job application.
    """
    print(
        f"Updating application {application_id} for user {user_id} with {updates}"
    )
    return {
        "id": application_id,
        "user_id": user_id,
        "company_name": updates.get("company_name", "Company"),
        "job_title": updates.get("job_title", " Job Title"),
        "status": updates.get("status", "Interview"),
    }


@tool
def delete_application(user_id: str, application_id: str) -> Dict[str, Any]:
    """
    s deleting a job application by its ID.
    """
    print(
        f": Deleting application {application_id} for user {user_id}"
    )
    return {"id": application_id, "user_id": user_id, "deleted": True}
