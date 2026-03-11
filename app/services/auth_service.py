from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import User
from app.schemas import FirstLoginPasswordChangeRequest, LoginRequest
from app.utils.password_utils import hash_password, verify_password


def authenticate_user(login_data: LoginRequest, db: Session) -> User:
    user = db.query(User).filter(User.email == login_data.email).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login error",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login denied",
        )

    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)

    return user


def change_password_on_first_login(
    password_data: FirstLoginPasswordChangeRequest,
    db: Session,
) -> User:
    user = db.query(User).filter(User.email == password_data.email).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login error",
        )

    if not verify_password(password_data.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login denied",
        )

    if not user.is_first_login:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password change is not required",
        )

    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password",
        )

    user.password_hash = hash_password(password_data.new_password)
    user.is_first_login = False
    db.commit()
    db.refresh(user)

    return user
