import random
import secrets
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import User
from app.schemas import OTPVerificationRequest, RegistrationRequest
from app.services.email_service import send_credentials_email, send_otp_email
from app.utils.password_utils import hash_password


OTP_EXPIRY_MINUTES = 10
pending_registrations: dict[str, dict] = {}


def _generate_otp() -> str:
    return f"{random.randint(100000, 999999)}"


def _generate_temporary_password() -> str:
    return secrets.token_hex(4)


def start_registration(registration_data: RegistrationRequest, db: Session) -> None:
    existing_user = db.query(User).filter(User.email == registration_data.email).first()
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists",
        )

    otp_code = _generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)

    pending_registrations[str(registration_data.email)] = {
        "registration_data": registration_data,
        "otp_code": otp_code,
        "expires_at": expires_at,
    }

    send_otp_email(str(registration_data.email), otp_code)


def verify_registration_otp(verification_data: OTPVerificationRequest, db: Session) -> User:
    pending_registration = pending_registrations.get(str(verification_data.email))

    if pending_registration is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration request not found",
        )

    if pending_registration["expires_at"] < datetime.utcnow():
        pending_registrations.pop(str(verification_data.email), None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired",
        )

    if pending_registration["otp_code"] != verification_data.otp_code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP",
        )

    registration_data = pending_registration["registration_data"]
    temporary_password = _generate_temporary_password()

    user = User(
        name=registration_data.name,
        email=str(registration_data.email),
        phone=registration_data.phone,
        address=registration_data.address,
        department=registration_data.department,
        password_hash=hash_password(temporary_password),
        otp_code=None,
        is_verified=True,
        is_first_login=True,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    pending_registrations.pop(str(verification_data.email), None)
    send_credentials_email(user.email, temporary_password)

    return user
