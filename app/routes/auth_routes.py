from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import (
    FirstLoginPasswordChangeRequest,
    LoginRequest,
    LoginResponse,
    MessageResponse,
)
from app.services.auth_service import (
    authenticate_user,
    change_password_on_first_login,
)
from app.utils.token_utils import create_access_token


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    user = authenticate_user(login_data, db)
    message = "First login detected" if user.is_first_login else "Login successful"
    next_step = (
        "Change password before continuing"
        if user.is_first_login
        else "Open dashboard"
    )

    return LoginResponse(
        message=message,
        user_id=user.id,
        name=user.name,
        email=user.email,
        is_verified=user.is_verified,
        is_first_login=user.is_first_login,
        next_step=next_step,
        access_token=create_access_token(user.id),
        token_type="bearer",
    )


@router.post("/change-password-first-login", response_model=MessageResponse)
def change_password_first_login(
    password_data: FirstLoginPasswordChangeRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    change_password_on_first_login(password_data, db)
    return MessageResponse(message="Password changed successfully")
