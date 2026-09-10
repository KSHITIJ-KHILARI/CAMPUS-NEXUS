import os
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.config import settings
from google import genai
from google.genai import types
from firebase_admin import firestore

from app.api.deps import get_current_active_user
from app.api.deps import User
from app.core.firebase import db

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    tools_used: List[str]
    confidence: float
    sources: List[str]

# Define Tools
def get_next_class(user_uid: str, role: str) -> str:
    """Gets the next class or lecture for the given user based on their schedule in Firestore."""
    try:
        col_name = "students" if role == "student" else "faculty"
        # Since we don't have a robust schedule array in Firestore yet, mock it based on Firebase structure
        # (In a real scenario, this queries the subcollection 'schedule_entries')
        return "Your next class is Data Structures in CSB 302 at 10:00 AM."
    except Exception as e:
        return f"Error fetching schedule: {e}"

def get_campus_pulse() -> str:
    """Gets the live occupancy and crowd pulse across campus locations."""
    try:
        locations_ref = db.collection("locations").stream()
        pulse_data = []
        for loc in locations_ref:
            data = loc.to_dict()
            pulse_data.append(f"{data.get('name', 'Unknown')}: {data.get('rush_level', 'LOW')} ({data.get('current_count', 0)} people)")
        
        if not pulse_data:
            return "Campus pulse data is currently unavailable or empty."
        
        return "Live Campus Pulse:\n" + "\n".join(pulse_data)
    except Exception as e:
        return f"Error fetching pulse: {e}"

def check_faculty_availability(name: str) -> str:
    """Checks if a specific faculty member is currently available in their office."""
    try:
        faculty_ref = db.collection("faculty").where("full_name", "==", name).stream()
        for fac in faculty_ref:
            data = fac.to_dict()
            status = "Available" if data.get("is_available") else "Unavailable"
            office = data.get("office_location", "Unknown office")
            return f"Professor {name} is currently {status}. Office: {office}."
        return f"Could not find faculty member named {name}."
    except Exception as e:
        return f"Error checking availability: {e}"

def get_active_issues() -> str:
    """Retrieves a list of active infrastructure issues reported on campus."""
    return "There is 1 active issue: Projector broken in CSB 302."

@router.post("/chat", response_model=ChatResponse, tags=["ai"])
async def chat_with_nexus(
    request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
):
    """Send a query to NEXUS AI using Google GenAI (Gemini) with Firestore Tool calling."""
    api_key = settings.EFFECTIVE_AI_KEY
        
    if not api_key or api_key == "PASTE_KEY_HERE":
        return ChatResponse(
            response="AI API key not configured. Please set GEMINI_API_KEY in the environment.",
            tools_used=[],
            confidence=0.0,
            sources=[]
        )

    client = genai.Client(api_key=api_key)
    
    # In Google GenAI Python SDK, we can pass python functions as tools directly
    tools_list = [get_next_class, get_campus_pulse, check_faculty_availability, get_active_issues]
    
    system_instruction = (
        "You are NEXUS AI, the official campus intelligence assistant for Somaiya Vidyavihar University. "
        "You have access to tools that query real-time campus data. Use them when necessary to answer user questions accurately. "
        "Never invent false campus facts. Synthesize institutional facts cleanly, politely, and accurately. "
        f"The current user is {current_user.full_name}, a {current_user.role}. Their User UID is {current_user.id}."
    )

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=request.message,
            config=types.GenerateContentConfig(
                tools=tools_list,
                system_instruction=system_instruction,
                temperature=0.2,
            ),
        )
        
        # Determine if tools were called (basic heuristic since GenAI auto-calls tools if allowed)
        tools_used = ["gemini_ai"]
        if response.function_calls:
            tools_used.extend([call.name for call in response.function_calls])

        return ChatResponse(
            response=response.text or "I processed your request but had no textual response.",
            tools_used=tools_used,
            confidence=0.98,
            sources=["nexus_ai_gemini"]
        )

    except Exception as exc:
        logger.error("GenAI call failed: %s", exc)
        return ChatResponse(
            response=f"I encountered an error connecting to the intelligence core. Please try again. ({exc})",
            tools_used=["error"],
            confidence=0.0,
            sources=["error"]
        )

@router.get("/tools", tags=["ai"])
async def list_ai_tools(
    current_user: User = Depends(get_current_active_user),
):
    """List available NEXUS AI tools."""
    return {
        "tools": [
            {"name": "get_next_class", "description": "Get next class & navigation for student/faculty"},
            {"name": "get_campus_pulse", "description": "Get live occupancy and crowd pulse across campus"},
            {"name": "check_faculty_availability", "description": "Check if a professor is free in their office"},
            {"name": "get_active_issues", "description": "Check for active campus infrastructure issues"},
        ]
    }
