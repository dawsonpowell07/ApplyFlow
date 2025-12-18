from typing import Dict, Any
from strands import Agent, tool
from strands_tools import http_request
from strands.models.gemini import GeminiModel
from strands.models.openai import OpenAIModel
from settings import get_settings

settings = get_settings()


def get_model():
    """Initialize and return the Gemini model for the agent."""
    return OpenAIModel(
        client_args={
            "api_key":  settings.OPENAI_API_KEY,
        },
        # **model_config
        model_id="gpt-5-mini",
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
            tools=[query_database, generate_report]
        )

        response = analytics_agent(query)
        return str(response)
    except Exception as e:
        return f"Error in job analytics assistant: {str(e)}"


@tool
def query_database(query_string: str) -> Dict[str, Any]:
    """
    s querying the database for analytics data.
    """
    print(f": Querying database with: {query_string}")
    return {
        "query": query_string,
        "results": [
            {"date": "2023-01-01", "applications_count": 10, "status": "Applied"},
            {"date": "2023-01-01", "applications_count": 5, "status": "Interview"},
            {"date": "2023-01-02", "applications_count": 8, "status": "Applied"},
        ],
    }


@tool
def generate_report(report_type: str, filters: Dict[str, Any]) -> Dict[str, Any]:
    """
    s generating an analytics report based on specified type and filters.
    """
    print(
        f": Generating report of type '{report_type}' with filters: {filters}")
    return {
        "report_id": f"-report-{report_type}-456",
        "type": report_type,
        "filters": filters,
        "data_summary": " data summary for the report.",
    }
