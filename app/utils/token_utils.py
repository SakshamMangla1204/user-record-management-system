import base64
import hashlib
import hmac
import json
import os
import time

from fastapi import HTTPException, status


SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
TOKEN_EXPIRE_SECONDS = 60 * 60 * 24


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_access_token(user_id: int) -> str:
    payload = {
        "user_id": user_id,
        "exp": int(time.time()) + TOKEN_EXPIRE_SECONDS,
    }
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    payload_part = _b64encode(payload_bytes)
    signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        payload_part.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    signature_part = _b64encode(signature)
    return f"{payload_part}.{signature_part}"


def decode_access_token(token: str) -> dict:
    try:
        payload_part, signature_part = token.split(".")
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from exc

    expected_signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        payload_part.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    provided_signature = _b64decode(signature_part)

    if not hmac.compare_digest(expected_signature, provided_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    payload = json.loads(_b64decode(payload_part).decode("utf-8"))

    if payload["exp"] < int(time.time()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )

    return payload
