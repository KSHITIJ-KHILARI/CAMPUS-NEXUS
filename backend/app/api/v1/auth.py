from fastapi import APIRouter, Depends
from app.api.deps import get_current_active_user, User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/verify", response_model=dict, tags=["auth"])
async def verify_token(current_user: User = Depends(get_current_active_user)):
    """
    Verifies the Firebase ID token and returns the current user.
    Used primarily by the Next.js frontend Server Components for route guarding.
    """
    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": str(current_user.role.value if hasattr(current_user.role, 'value') else current_user.role)
        }
    }
