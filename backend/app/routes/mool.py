from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.services.mool_service import calculate_financials

router = APIRouter(prefix="/mool", tags=["Mool — Financial Calculator"])


class MoolRequest(BaseModel):
    business_id: int
    total_project_cost: float
    own_capital: float
    tenure_months: int = 60


class MoolResponse(BaseModel):
    loan_amount: float
    emi: float
    interest_rate: float
    total_interest: float
    working_capital: float
    repayment_schedule: list


@router.post("/calculate", response_model=MoolResponse, summary="Calculate loan & EMI details")
def calculate(payload: MoolRequest, db: Session = Depends(get_db)):
    """
    Mool (Root) — Calculates 90% loan amount, EMI, interest, tenure,
    and working capital for the business.
    """
    result = calculate_financials(payload.dict(), db)
    if not result:
        raise HTTPException(status_code=400, detail="Financial calculation failed")
    return result
