from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.services.shakha_service import match_scheme

router = APIRouter(prefix="/shakha", tags=["Shakha — Scheme Selector"])


class ShakhaRequest(BaseModel):
    business_id: int
    category: str
    loan_amount: float
    district: str
    user_caste: str = "general"   # general | sc | st | obc | minority


class ShakhaResponse(BaseModel):
    scheme_id: int
    scheme_name: str
    interest_rate: float
    tenure_months: int
    subsidy: str
    documents_required: list
    next_steps: list


@router.post("/match", response_model=ShakhaResponse, summary="Auto-select best government scheme")
def select_scheme(payload: ShakhaRequest, db: Session = Depends(get_db)):
    """
    Shakha (Branch) — Automatically selects the most suitable government
    loan scheme based on business category, loan size, and user profile.
    """
    result = match_scheme(payload.dict(), db)
    if not result:
        raise HTTPException(status_code=404, detail="No matching scheme found")
    return result


@router.get("/all", summary="List all available schemes")
def list_schemes(db: Session = Depends(get_db)):
    from app.models.scheme import Scheme
    return db.query(Scheme).all()
