from typing import Optional

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    message: str
    user_id: int
    name: str
    email: EmailStr
    is_verified: bool
    is_first_login: bool
    next_step: str
    access_token: str
    token_type: str


class FirstLoginPasswordChangeRequest(BaseModel):
    email: EmailStr
    current_password: str
    new_password: str


class MessageResponse(BaseModel):
    message: str


class UserRecordResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str]
    address: Optional[str]
    department: Optional[str]
    is_verified: bool
    is_first_login: bool
    is_active: bool

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    department: Optional[str] = None


class DeleteUserRequest(BaseModel):
    email: Optional[EmailStr] = None
    confirm: bool


class RegistrationRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    department: Optional[str] = None


class OTPVerificationRequest(BaseModel):
    email: EmailStr
    otp_code: str


class ImportResponse(BaseModel):
    message: str
    imported_count: int
    skipped_count: int
