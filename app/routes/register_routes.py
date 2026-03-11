from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import MessageResponse, OTPVerificationRequest, RegistrationRequest
from app.services.otp_service import start_registration, verify_registration_otp


router = APIRouter(prefix="/register", tags=["Registration"])


@router.post("/request-otp", response_model=MessageResponse)
def request_registration_otp(
    registration_data: RegistrationRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    start_registration(registration_data, db)
    return MessageResponse(message="OTP sent to user email")


@router.post("/verify_otp", response_model=MessageResponse)
def verify_otp_and_create_account(
    verification_data: OTPVerificationRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    verify_registration_otp(verification_data, db)
    return MessageResponse(message="User account created and credentials emailed")
