from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import User
from app.schemas import UserUpdateRequest


def get_user_record(user_id: int, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User record not found",
        )

    return user


def update_user_record(user_id: int, update_data: UserUpdateRequest, db: Session) -> User:
    user = get_user_record(user_id, db)

    if hasattr(update_data, "model_dump"):
        updated_fields = update_data.model_dump(exclude_unset=True)
    else:
        updated_fields = update_data.dict(exclude_unset=True)

    for field, value in updated_fields.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


def delete_user_record(user_id: int, db: Session) -> None:
    user = get_user_record(user_id, db)
    db.delete(user)
    db.commit()
