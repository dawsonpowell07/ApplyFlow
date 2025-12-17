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


RESUME_PROMPT = """
You are a specialized resume optimization and career coaching assistant.
Your role is to:
- Provide expert tips for improving resumes and cover letters
- Analyze job descriptions and tailor resume content accordingly
- Suggest keywords and phrases that match specific job postings
- Review resume sections and provide actionable feedback
- Recommend skills and experiences to highlight for different roles
- Help optimize resume format and structure
- Provide insights on ATS (Applicant Tracking System) compatibility
- Suggest quantifiable achievements and impact statements

Always provide specific, actionable advice tailored to the user's target role
and industry.
"""


@tool
def resume_assistant(query: str) -> str:
    """
    Provide resume tips, insights, and tailoring recommendations based on
    job descriptions and career goals.

    Args:
        query: A request for resume advice, job description analysis,
               resume tailoring, or career positioning guidance

    Returns:
        Detailed resume recommendations and tailoring insights
    """
    try:
        resume_agent = Agent(
            model=get_model(),
            system_prompt=RESUME_PROMPT,
            tools=[http_request]
        )

        response = resume_agent(query)
        return str(response)
    except Exception as e:
        return f"Error in resume assistant: {str(e)}"
