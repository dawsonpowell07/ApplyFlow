from strands import Agent, tool
from strands_tools import retrieve, http_request
from strands.models.gemini import GeminiModel
from dotenv import load_dotenv
import os

load_dotenv()


def get_model():
    """Initialize and return the Gemini model for the agent."""
    return GeminiModel(
        client_args={
            "api_key": os.environ.get("GOOGLE_API_KEY", None),
        },
        model_id="gemini-2.5-flash-lite",
    )


ANALYTICS_PROMPT = """
You are a specialized job application analytics and insights assistant.
Your role is to:
- Analyze job application data and provide actionable insights
- Track application success rates and patterns
- Identify trends in interview processes and outcomes
- Provide data-driven recommendations for improving application success
- Generate reports on application status, response times, and conversion rates
- Analyze which types of jobs, companies, or industries yield better results

Always provide data-backed insights and practical recommendations.
"""


@tool
def job_analytics_assistant(query: str) -> str:
    """
    Analyze job application data and provide insights and recommendations.

    Args:
        query: A question about job application analytics, trends, success rates,
               or data-driven insights about the application process

    Returns:
        Detailed analytics insights with data-driven recommendations
    """
    try:
        analytics_agent = Agent(
            model=get_model(),
            system_prompt=ANALYTICS_PROMPT,
            tools=[retrieve, http_request]
        )

        response = analytics_agent(query)
        return str(response)
    except Exception as e:
        return f"Error in job analytics assistant: {str(e)}"
