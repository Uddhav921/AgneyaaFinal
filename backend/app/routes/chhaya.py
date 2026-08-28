from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.services.chhaya_service import generate_report

router = APIRouter(prefix="/chhaya", tags=["Chhaya — Report & Post-Approval"])


class ChhayaRequest(BaseModel):
    business_id: int


class ReportResponse(BaseModel):
    business_idea: str
    location: str
    feasibility: str
    demand_score: float
    loan_amount: float
    scheme_name: str
    emi: float
    verdict: str          # GO | CAUTION | NO-GO
    summary: str
    csr_opportunities: list
    post_approval_steps: list


@router.post("/report", response_model=ReportResponse, summary="Generate final feasibility report")
def get_report(payload: ChhayaRequest, db: Session = Depends(get_db)):
    """
    Chhaya (Shade) — Combines Beej + Mool + Shakha results into a final
    Business Feasibility Report with CSR funding opportunities and post-approval steps.
    """
    result = generate_report(payload.business_id, db)
    if not result:
        raise HTTPException(status_code=404, detail="Business data not found for report generation")
    return result


@router.get("/csr", summary="List CSR funding opportunities")
def csr_opportunities():
    """Returns a list of CSR organizations that fund rural businesses."""
    return {
        "csr_funders": [
            {"name": "Tata Trusts", "focus": "Rural livelihood, agriculture"},
            {"name": "Reliance Foundation", "focus": "Rural development, women empowerment"},
            {"name": "HDFC Parivartan", "focus": "Micro-enterprise, skill development"},
            {"name": "Infosys Foundation", "focus": "Rural infrastructure, education"},
        ]
    }
