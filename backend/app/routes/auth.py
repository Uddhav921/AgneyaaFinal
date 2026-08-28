import os
import jwt
import requests
from pathlib import Path
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from dotenv import dotenv_values
from app.database import get_db

# ── Config ───────────────────────────────────────────────────────
_ENV = dotenv_values(Path(__file__).resolve().parents[2] / ".env")

GOOGLE_CLIENT_ID:     str = _ENV.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET: str = _ENV.get("GOOGLE_CLIENT_SECRET", "")
SECRET_KEY:           str = _ENV.get("SECRET_KEY", "change-me-in-production")
FRONTEND_URL:         str = _ENV.get("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL:          str = _ENV.get("BACKEND_URL", "http://localhost:8000")
JWT_EXPIRE_HOURS:     int = 24 * 7   # 7 days

GOOGLE_TOKEN_URL   = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GOOGLE_AUTH_BASE   = "https://accounts.google.com/o/oauth2/v2/auth"

REDIRECT_URI = f"{BACKEND_URL}/api/v1/auth/google/callback"

router   = APIRouter(prefix="/auth", tags=["Auth — Google OAuth"])
security = HTTPBearer()


# ── Pydantic Schemas ─────────────────────────────────────────────

class ProfileUpdate(BaseModel):
    language: str = "en"
    consent:  bool = False


# ── JWT Helpers ──────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    """Issues our own JWT signed with SECRET_KEY."""
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def verify_token(token: str) -> dict:
    """Verifies our own JWT. Raises 401 on failure."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired — please sign in again")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """FastAPI dependency — extracts & verifies user from Bearer token."""
    return verify_token(credentials.credentials)


# ── Routes ───────────────────────────────────────────────────────

@router.get("/google/login", summary="Redirect to Google OAuth consent screen")
def google_login():
    """
    Redirects the browser to Google's OAuth 2.0 consent page.
    Frontend navigates to this endpoint to start the login flow.
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_CLIENT_ID not set in backend/.env",
        )

    params = (
        f"client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=openid%20email%20profile"
        f"&access_type=offline"
        f"&prompt=select_account"
    )
    return RedirectResponse(url=f"{GOOGLE_AUTH_BASE}?{params}", status_code=302)


@router.get("/google/callback", summary="Handle Google OAuth callback & issue JWT")
def google_callback(code: str | None = None, error: str | None = None):
    """
    Google redirects here after user approves.
    1. Exchanges the authorization code for tokens
    2. Fetches user info from Google
    3. Issues our own JWT
    4. Redirects frontend to /auth/callback#token=<JWT>
    """
    if error:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/auth/callback?error={error}", status_code=302
        )

    if not code:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/auth/callback?error=no_code", status_code=302
        )

    if not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_CLIENT_SECRET not set in backend/.env",
        )

    # Step 1: Exchange code for Google access + id tokens
    token_resp = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            "code":          code,
            "client_id":     GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri":  REDIRECT_URI,
            "grant_type":    "authorization_code",
        },
        timeout=10,
    )
    if not token_resp.ok:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/auth/callback?error=token_exchange_failed",
            status_code=302,
        )

    google_tokens = token_resp.json()
    google_access_token = google_tokens.get("access_token")

    # Step 2: Fetch user info from Google
    userinfo_resp = requests.get(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {google_access_token}"},
        timeout=10,
    )
    if not userinfo_resp.ok:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/auth/callback?error=userinfo_failed",
            status_code=302,
        )

    userinfo = userinfo_resp.json()
    google_id  = userinfo.get("id")
    email      = userinfo.get("email", "")
    name       = userinfo.get("name") or email.split("@")[0]
    avatar_url = userinfo.get("picture", "")

    # Step 3: Issue our own JWT
    our_token = create_access_token({
        "sub":        google_id,
        "email":      email,
        "name":       name,
        "avatar_url": avatar_url,
        "provider":   "google",
    })

    # Step 4: Redirect frontend with token in URL fragment (not query — keeps it out of server logs)
    return RedirectResponse(
        url=f"{FRONTEND_URL}/auth/callback#token={our_token}",
        status_code=302,
    )


@router.get("/me", summary="Get current authenticated user")
def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the decoded user info from the JWT."""
    return {
        "id":         current_user.get("sub"),
        "email":      current_user.get("email"),
        "name":       current_user.get("name"),
        "avatar_url": current_user.get("avatar_url"),
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
    google_id = current_user.get("sub")
    email     = current_user.get("email", "")
    name      = current_user.get("name") or email.split("@")[0]
    avatar    = current_user.get("avatar_url", "")

    try:
        db.execute(text("""
            INSERT INTO users (google_id, name, email, avatar_url, language, consent)
            VALUES (:gid, :name, :email, :avatar, :lang, :consent)
            ON DUPLICATE KEY UPDATE
                language   = VALUES(language),
                consent    = VALUES(consent),
                updated_at = NOW()
        """), {
            "gid":    google_id,
            "name":   name,
            "email":  email,
            "avatar": avatar,
            "lang":   payload.language,
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
    google_id = current_user.get("sub")
    try:
        result = db.execute(
            text("SELECT consent FROM users WHERE google_id = :gid"),
            {"gid": google_id}
        ).fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if result and result[0]:
        return {"onboarded": True}
    return {"onboarded": False}
