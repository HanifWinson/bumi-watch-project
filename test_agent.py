import asyncio
import os
from dotenv import load_dotenv
from google.adk.agents import LlmAgent
from google.adk.tools.mcp_tool.mcp_toolset import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import SseServerParams
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

load_dotenv()

os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY", "")

MCP_URL = "https://bumiwatch-mcp-338260459122.asia-southeast2.run.app/sse"

async def main():
    print("🌿 Testing Bumi Watch MCP connection via SSE...")

    toolset = McpToolset(
        connection_params=SseServerParams(url=MCP_URL)
    )

    tools = await toolset.get_tools()
    print(f"✅ MCP tools loaded: {[t.name for t in tools]}")

    agent = LlmAgent(
        name="bumi_watch_agent",
        model="gemini-2.5-flash",
        instruction="You are Bumi Watch, an AI environmental intelligence assistant for Indonesia.",
        tools=[toolset],
    )

    session_service = InMemorySessionService()
    session = await session_service.create_session(
        app_name="bumi_watch",
        user_id="test_user",
    )

    runner = Runner(
        agent=agent,
        app_name="bumi_watch",
        session_service=session_service,
    )

    question = "Bagaimana kondisi lingkungan di Jakarta?"
    print(f"\n🤖 Question: {question}\n")

    async for event in runner.run_async(
        user_id="test_user",
        session_id=session.id,
        new_message=types.Content(
            role="user",
            parts=[types.Part(text=question)]
        )
    ):
        if event.is_final_response():
            print(f"✅ Answer:\n{event.content.parts[0].text}")

    await toolset.close()

asyncio.run(main())