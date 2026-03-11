from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.database import Base


class User(Base):
    __tablename__ = "users"

    # User identity data
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    address = Column(String(255), nullable=True)
    department = Column(String(100), nullable=True)

    # Authentication data
    password_hash = Column(String(255), nullable=False)
    otp_code = Column(String(10), nullable=True)

    # System control flags
    is_verified = Column(Boolean, default=False, nullable=False)
    is_first_login = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Audit timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)
