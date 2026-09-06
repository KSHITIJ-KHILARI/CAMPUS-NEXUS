"""NEXUS AI API v1 routes with single NEXUS_API_KEY server configuration and Ollama/DB fallback."""

import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.api.deps import get_current_db, get_current_active_user
from app.core.config import settings
from app.models.user import User
from app.services.ai_orchestrator_service import AIOrchestratorService

logger = logging.getLogger(__name__)

router = APIRouter()
orchestrator = AIOrchestratorService()


class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    response: str
    tools_used: List[str]
    confidence: float
    sources: List[str]


@router.post("/chat", response_model=ChatResponse, tags=["ai"])
async def chat_with_nexus(
    request: ChatRequest,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Send a query to NEXUS AI. Processed server-side using NEXUS_API_KEY or local Ollama / DB tools."""
    # 1. Process query against PostgreSQL digital twin facts & tools
    orch_result = await orchestrator.process_query(
        user=current_user,
        query=request.message,
        context=request.context,
        db=db,
    )

    # 2. Try the configured LLM provider (OpenRouter by default) if API key is set
    api_key = settings.EFFECTIVE_AI_KEY
    if api_key and api_key != "PASTE_KEY_HERE" and api_key != "your-openai-api-key":
        model_name = settings.LLM_MODEL or "minimax/minimax-m3:free"

        if settings.LLM_PROVIDER and settings.LLM_PROVIDER.lower() == "openrouter":
            api_url = f"{settings.OPENROUTER_BASE_URL}/chat/completions"
            provider_headers = {
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Campus NEXUS",
            }
        else:
            api_url = "https://api.openai.com/v1/chat/completions"
            provider_headers = {}

        prompt_system = (
            "You are NEXUS AI, the official campus intelligence assistant for Somaiya Vidyavihar University. "
            "Synthesize institutional facts cleanly, politely, and accurately. Never invent false campus facts. "
            "If you cannot answer from the provided context, say so clearly and suggest what tool to use."
        )
        now_ist = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
        prompt_user = (
            f"User Name: {current_user.full_name} ({current_user.role})\n"
            f"Current Date & Time (Asia/Kolkata): {now_ist.strftime('%A, %B %d, %Y %I:%M %p')}\n"
            f"Campus Database Ground Truth Context: {orch_result.get('response')}\n"
            f"User Question: {request.message}"
        )

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(
                    api_url,
                    headers={"Authorization": f"Bearer {api_key}", **provider_headers},
                    json={
                        "model": model_name,
                        "messages": [
                            {"role": "system", "content": prompt_system},
                            {"role": "user", "content": prompt_user},
                        ],
                        "temperature": 0.2,
                        "top_p": 0.9,
                        "max_tokens": 500,
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices:
                        answer = choices[0]["message"]["content"].strip()
                        return ChatResponse(
                            response=answer,
                            tools_used=orch_result.get("tools_used", ["nexus_ai_engine"]),
                            confidence=0.98,
                            sources=["nexus_llm_provider", "somaiya_nexus_db"],
                        )
        except Exception as exc:
            logger.warning("External AI provider call failed gracefully: %s", exc)

    # 3. Try local Ollama if running
    if settings.OLLAMA_BASE_URL:
        try:
            prompt = (
                f"You are NEXUS AI, the campus intelligence assistant for Somaiya Vidyavihar University.\n"
                f"User: {current_user.full_name} ({current_user.role})\n"
                f"Campus Context: {orch_result.get('response')}\n"
                f"User Question: {request.message}\n"
                f"Answer concisely and helpfully."
            )
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={"model": settings.OLLAMA_MODEL, "prompt": prompt, "stream": False},
                )
                if res.status_code == 200:
                    llm_text = res.json().get("response", "").strip()
                    if llm_text:
                        return ChatResponse(
                            response=llm_text,
                            tools_used=orch_result.get("tools_used", ["ollama_local"]),
                            confidence=0.95,
                            sources=["ollama_local", "somaiya_nexus_db"],
                        )
        except Exception:
            pass

    # 4. Deterministic PostgreSQL Digital Twin Fallback
    return ChatResponse(
        response=orch_result.get("response", "I am NEXUS AI, here to assist with Somaiya Campus intelligence."),
        tools_used=orch_result.get("tools_used", ["campus_digital_twin"]),
        confidence=orch_result.get("confidence", 0.92),
        sources=["somaiya_nexus_db", "digital_twin_engine"],
    )


@router.get("/tools", tags=["ai"])
async def list_ai_tools(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """List available NEXUS AI tools."""
    return {
        "tools": [
            {"name": "get_next_class", "description": "Get next class & navigation for student/faculty"},
            {"name": "calculate_leave_time", "description": "Calculate Leave Now ETA taking lift status into account"},
            {"name": "get_campus_pulse", "description": "Get live occupancy and crowd pulse across campus"},
            {"name": "find_available_rooms", "description": "Find vacant classrooms and labs"},
            {"name": "search_library_books", "description": "Search library catalog & book availability"},
            {"name": "reserve_book", "description": "Reserve available library books"},
            {"name": "search_learning_resources", "description": "Find course textbooks, notes, and videos"},
            {"name": "report_issue", "description": "Report campus infrastructure issues"},
            {"name": "run_simulation", "description": "Run What-If campus simulation scenarios"},
        ]
    }
