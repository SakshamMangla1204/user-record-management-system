def send_otp_email(email: str, otp_code: str) -> None:
    """
    Placeholder email sender for OTP delivery.
    Replace this with SMTP or a transactional email provider later.
    """
    print(f"[EMAIL] Sent OTP {otp_code} to {email}")


def send_credentials_email(email: str, temporary_password: str) -> None:
    """
    Placeholder email sender for account credentials delivery.
    Replace this with a real email backend later.
    """
    print(
        f"[EMAIL] Sent temporary credentials to {email}. "
        f"Temporary password: {temporary_password}"
    )


def send_import_credentials_email(email: str, temporary_password: str) -> None:
    """
    Placeholder email sender for accounts created from Excel import.
    """
    print(
        f"[EMAIL] Sent imported user credentials to {email}. "
        f"Temporary password: {temporary_password}"
    )
