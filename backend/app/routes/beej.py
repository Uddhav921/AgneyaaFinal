from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.services.beej_service import run_beej_analysis

router = APIRouter(prefix="/beej", tags=["Beej — Market Analysis"])


class BeejRequest(BaseModel):
    business_id: int
    business_idea: str
    category: str
    village: str
    block: str
    district: str


class BeejResponse(BaseModel):
    demand_score: float
    competition: str
    avg_price: float
    customer_base: str
    opportunities: str
    risks: str
    feasibility: str
    ai_summary: str


@router.post("/analyse", response_model=BeejResponse, summary="Run hyper-local market analysis")
async def analyse_market(payload: BeejRequest, db: Session = Depends(get_db)):
    """
    Beej (Seed) — Analyses local market feasibility for a business idea.
    Returns demand, competition, pricing, opportunities, risks, and overall feasibility.
    """
    result = await run_beej_analysis(payload.dict(), db)
    if not result:
        raise HTTPException(status_code=500, detail="Market analysis failed")
    return result


@router.get("/result/{business_id}", summary="Get existing market analysis result")
def get_analysis(business_id: int, db: Session = Depends(get_db)):
    from app.models.evidence import Evidence
    ev = db.query(Evidence).filter(Evidence.business_id == business_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="No analysis found for this business")
    return ev
