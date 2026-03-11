from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import (
    DeleteUserRequest,
    MessageResponse,
    UserRecordResponse,
    UserUpdateRequest,
)
from app.services.user_service import (
    delete_user_record,
    get_user_record,
    update_user_record,
)
from app.utils.token_utils import decode_access_token


router = APIRouter(prefix="/user", tags=["User Dashboard"])


def get_current_user_id(authorization: str = Header(...)) -> int:
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )

    token = authorization.removeprefix("Bearer ").strip()
    payload = decode_access_token(token)
    return int(payload["user_id"])


@router.get("/me", response_model=UserRecordResponse)
def view_user_record(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> UserRecordResponse:
    user = get_user_record(user_id, db)
    return user


@router.put("/me", response_model=UserRecordResponse)
def edit_user_record(
    update_data: UserUpdateRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> UserRecordResponse:
    user = update_user_record(user_id, update_data, db)
    return user


@router.delete("/me", response_model=MessageResponse)
def remove_user_record(
    delete_data: DeleteUserRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> MessageResponse:
    if not delete_data.confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deletion confirmation is required",
        )

    delete_user_record(user_id, db)
    return MessageResponse(message="User record deleted successfully")
