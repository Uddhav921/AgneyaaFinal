import os
import jwt
import base64
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from dotenv import dotenv_values
from app.database import get_db

# Load .env using absolute path — avoids CWD issues with dotenv
_ENV = dotenv_values(Path(__file__).resolve().parents[2] / ".env")

SUPABASE_JWT_SECRET: str = _ENV.get("SUPABASE_JWT_SECRET", "")

router = APIRouter(prefix="/auth", tags=["Auth — Supabase Google Login"])
security = HTTPBearer()


# ── Pydantic Schemas ─────────────────────────────────────────────

class UserProfile(BaseModel):
    id: str
    email: str
    name: str | None = None
    avatar_url: str | None = None
    provider: str = "google"


class ProfileUpdate(BaseModel):
    language: str = "en"
    consent: bool = False


# ── JWT Verification Helper ──────────────────────────────────────

def verify_supabase_token(token: str) -> dict:
    """
    Verifies a Supabase JWT token using the raw JWT secret string.
    """
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(status_code=500, detail="SUPABASE_JWT_SECRET not configured in backend/.env")
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired — please sign in again")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """FastAPI dependency — extracts & verifies user from Bearer token."""
    return verify_supabase_token(credentials.credentials)


# ── Routes ───────────────────────────────────────────────────────

@router.post("/verify", summary="Verify Supabase JWT & return user profile")
def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """
    Called by frontend after Google Sign-In via Supabase.
    Verifies the JWT, extracts user info, and returns a profile.
    """
    payload = verify_supabase_token(credentials.credentials)

    user_meta = payload.get("user_metadata", {})

    return {
        "status":     "authenticated",
        "id":         payload.get("sub"),
        "email":      payload.get("email"),
        "name":       user_meta.get("full_name") or user_meta.get("name"),
        "avatar_url": user_meta.get("avatar_url") or user_meta.get("picture"),
        "provider":   "google",
    }


@router.get("/me", summary="Get current authenticated user")
def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the decoded user info from the JWT."""
    return {
        "id":    current_user.get("sub"),
        "email": current_user.get("email"),
        "role":  current_user.get("role", "authenticated"),
    }


@router.post("/upsert-user", summary="Auto-save Google user to DB on login")
def upsert_user(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Called right after Google Sign-In via Supabase.
    Inserts user into the users table if not exists,
    or updates email/full_name if already present.

    Table schema: id | supabase_id | email | full_name | phone | role | created_at | updated_at
    """
    supabase_id = current_user.get("sub")
    email       = current_user.get("email", "")
    meta        = current_user.get("user_metadata", {})
    full_name   = meta.get("full_name") or meta.get("name") or email.split("@")[0]

    try:
        db.execute(text("""
            INSERT INTO users (supabase_id, email, full_name, role)
            VALUES (:sid, :email, :full_name, 'user')
            ON DUPLICATE KEY UPDATE
                email     = VALUES(email),
                full_name = VALUES(full_name),
                updated_at = NOW()
        """), {
            "sid":       supabase_id,
            "email":     email,
            "full_name": full_name,
        })
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")

    return {
        "status":      "saved",
        "supabase_id": supabase_id,
        "email":       email,
        "full_name":   full_name,
    }


@router.post("/profile", summary="Save user language & consent after onboarding")
def save_profile(
    payload: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upserts the user's language preference and consent into the users table.
    Called after Step 1 of the onboarding flow.
    """
    user_id   = current_user.get("sub")
    email     = current_user.get("email", "")
    meta      = current_user.get("user_metadata", {})
    name      = meta.get("full_name") or meta.get("name") or email.split("@")[0]
    avatar    = meta.get("avatar_url") or meta.get("picture") or ""

    try:
        # Upsert: insert if not exists, update if already present
        db.execute(text("""
            INSERT INTO users (google_id, name, email, language, consent)
            VALUES (:gid, :name, :email, :lang, :consent)
            ON DUPLICATE KEY UPDATE
                language = VALUES(language),
                consent  = VALUES(consent)
        """), {
            "gid":     user_id,
            "name":    name,
            "email":   email,
            "lang":    payload.language,
            "consent": int(payload.consent),
        })
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")

    return {"status": "saved", "language": payload.language, "consent": payload.consent}


@router.get("/onboard-status", summary="Check if user has completed onboarding")
def onboard_status(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns whether the user has already submitted their language + consent.
    Frontend uses this to skip onboarding if already done.
    """
    user_id = current_user.get("sub")
    try:
        result = db.execute(
            text("SELECT consent FROM users WHERE google_id = :gid"),
            {"gid": user_id}
        ).fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if result and result[0]:
        return {"onboarded": True}
    return {"onboarded": False}
