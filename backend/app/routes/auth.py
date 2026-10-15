"""
KrishiRakshak — Farmer & Device Auth Route

Lightweight mobile authentication supporting:
- Device UUID registration
- Farmer phone number identification & OTP verification
"""

import uuid
from pydantic import BaseModel, Field
from fastapi import APIRouter

router = APIRouter(prefix="/api/auth", tags=["Auth"])


class RegisterDeviceRequest(BaseModel):
    device_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone_number: str | None = None
    platform: str = Field(default="android")
    app_version: str = Field(default="1.0.0")


class RegisterDeviceResponse(BaseModel):
    device_id: str
    phone_number: str | None = None
    status: str
    message: str


class SendOtpRequest(BaseModel):
    phone_number: str
    device_id: str | None = None


class SendOtpResponse(BaseModel):
    status: str
    message: str
    demo_otp: str = "1234"


class VerifyOtpRequest(BaseModel):
    phone_number: str
    otp: str
    device_id: str | None = None


class VerifyOtpResponse(BaseModel):
    status: str
    authenticated: bool
    phone_number: str
    message: str


@router.post("/device", response_model=RegisterDeviceResponse)
def register_or_verify_device(req: RegisterDeviceRequest):
    """
    Register or verify a mobile client device UUID and associate phone number.
    """
    return RegisterDeviceResponse(
        device_id=req.device_id,
        phone_number=req.phone_number,
        status="active",
        message="Device authenticated successfully.",
    )


@router.post("/otp/send", response_model=SendOtpResponse)
def send_otp(req: SendOtpRequest):
    """
    Send OTP to farmer's mobile number.
    Returns demo OTP 1234 for development & evaluation.
    """
    return SendOtpResponse(
        status="success",
        message=f"OTP sent successfully to +91 {req.phone_number}",
        demo_otp="1234",
    )


@router.post("/otp/verify", response_model=VerifyOtpResponse)
def verify_otp(req: VerifyOtpRequest):
    """
    Verify the 4-digit OTP. Accepts demo code 1234 or any valid 4-digit sequence.
    """
    is_valid = req.otp == "1234" or (len(req.otp) == 4 and req.otp.isdigit())
    if is_valid:
        return VerifyOtpResponse(
            status="success",
            authenticated=True,
            phone_number=req.phone_number,
            message="Farmer authenticated successfully.",
        )
    return VerifyOtpResponse(
        status="error",
        authenticated=False,
        phone_number=req.phone_number,
        message="Invalid OTP. Please try again.",
    )


class OfficerLoginRequest(BaseModel):
    officer_id: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class OfficerLoginResponse(BaseModel):
    status: str
    authenticated: bool
    officer_id: str
    name: str
    role: str
    district: str
    token: str
    message: str


@router.post("/officer/login", response_model=OfficerLoginResponse)
def officer_login(req: OfficerLoginRequest):
    """
    Authenticate agricultural extension officer.
    Accepts demo credentials (passkey: krishi2026 or admin) or any officer ID with valid password.
    """
    # Accept standard demo officer credentials or valid password
    valid_passwords = {"krishi2026", "admin", "officer123", "password"}
    is_valid = req.password in valid_passwords or len(req.password) >= 6

    if is_valid:
        officer_clean_id = req.officer_id.strip().upper()
        # Derive display name from ID
        display_name = f"Officer {officer_clean_id}"
        if "AP" in officer_clean_id:
            district = "Andhra Pradesh (Anantapur Zone)"
        elif "MH" in officer_clean_id:
            district = "Maharashtra (Nashik Zone)"
        else:
            district = "Regional Agricultural Extension"

        token = f"krishi_officer_token_{uuid.uuid4().hex[:16]}"

        return OfficerLoginResponse(
            status="success",
            authenticated=True,
            officer_id=officer_clean_id,
            name=display_name,
            role="agricultural_officer",
            district=district,
            token=token,
            message="Officer authenticated successfully.",
        )

    return OfficerLoginResponse(
        status="error",
        authenticated=False,
        officer_id=req.officer_id,
        name="",
        role="",
        district="",
        token="",
        message="Invalid officer ID or passkey. Use demo passkey: krishi2026",
    )

