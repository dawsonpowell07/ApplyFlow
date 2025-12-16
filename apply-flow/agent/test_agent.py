"""Test script for interactive conversation with the Strands agent."""

import json
import os

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from strands import Agent, tool
from strands.models.openai import OpenAIModel
from strands.session.file_session_manager import FileSessionManager

load_dotenv()


class ProverbsList(BaseModel):
    """A list of proverbs."""

    proverbs: list[str] = Field(description="The complete list of proverbs")


@tool
def get_weather(location: str):
    """Get the weather for a location.

    Args:
        location: The location to get weather for

    Returns:
        Weather information as JSON string
    """
    return json.dumps({"location": location, "temperature": "70 degrees", "condition": "sunny"})


@tool
def set_theme_color(theme_color: str):
    """Change the theme color of the UI.

    Args:
        theme_color: The color to set as theme
    """
    return f"Theme color set to {theme_color}"


@tool
def update_proverbs(proverbs_list: ProverbsList):
    """Update the complete list of proverbs.

    IMPORTANT: Always provide the entire list, not just new proverbs.

    Args:
        proverbs_list: The complete updated proverbs list

    Returns:
        Success message
    """
    return f"Proverbs updated successfully. Total proverbs: {len(proverbs_list.proverbs)}"


def main():
    """Run interactive conversation with the agent."""
    # Initialize OpenAI model
    api_key = os.getenv("OPENAI_API_KEY", "")
    model = OpenAIModel(
        client_args={"api_key": api_key},
        model_id="gpt-4o",
    )

    # Create session manager
    session_manager = FileSessionManager(
        session_id="test-interactive"
    )

    system_prompt = (
        "You are a helpful and wise assistant that helps manage a collection of proverbs."
    )

    # Create Strands agent with tools
    agent = Agent(
        model=model,
        system_prompt=system_prompt,
        tools=[update_proverbs, get_weather, set_theme_color],
        session_manager=session_manager,
    )

    print("=" * 60)
    print("Strands Agent Test - Interactive Mode")
    print("=" * 60)
    print("Type your messages below. Commands:")
    print("  'quit' or 'exit' - Exit the conversation")
    print("  'clear' - Clear conversation history")
    print("  'history' - Show conversation history")
    print("=" * 60)
    print()

    while True:
        try:
            user_input = input("You: ").strip()

            if not user_input:
                continue

            if user_input.lower() in ['quit', 'exit']:
                print("\nGoodbye!")
                break

            if user_input.lower() == 'history':
                print("\n--- Conversation History ---")
                for i, msg in enumerate(agent.messages, 1):
                    role = msg.get('role', 'unknown')
                    content = msg.get('content', '')
                    if isinstance(content, list):
                        content = str(content)
                    print(f"{i}. [{role}]: {content[:100]}...")
                print("--- End of History ---\n")
                continue

            # Send message to agent
            print("\nAgent: ", end="", flush=True)
            agent(user_input)
            print()

        except KeyboardInterrupt:
            print("\n\nInterrupted. Goodbye!")
            break
        except Exception as e:
            print(f"\nError: {e}\n")
            continue


if __name__ == "__main__":
    main()
