from fastapi import Depends, HTTPException, status
from app.routers.submissions import get_current_user

async def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    """Verify that the current logged-in user has admin role."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user 