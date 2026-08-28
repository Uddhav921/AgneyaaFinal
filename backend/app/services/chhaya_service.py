from sqlalchemy.orm import Session
from app.models.business import Business
from app.models.evidence import Evidence
from app.models.scheme import Scheme


def generate_report(business_id: int, db: Session) -> dict | None:
    """
    Chhaya Service — Aggregates Beej + Mool + Shakha data into
    a final Business Feasibility Report.
    """
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        return None

    ev  = db.query(Evidence).filter(Evidence.business_id == business_id).first()

    # Determine verdict
    demand_score = ev.demand_score if ev else 0
    feasibility  = ev.feasibility if ev else "unknown"

    if demand_score >= 7 and feasibility == "viable":
        verdict = "GO"
    elif demand_score >= 5:
        verdict = "CAUTION"
    else:
        verdict = "NO-GO"

    loan_amount = biz.loan_amount or 0
    emi         = round((loan_amount * 0.07 / 12) / (1 - (1 + 0.07/12)**-60), 2) if loan_amount else 0

    return {
        "business_idea":  biz.business_idea,
        "location":       f"{biz.village}, {biz.block}, {biz.district}",
        "feasibility":    feasibility,
        "demand_score":   demand_score,
        "loan_amount":    loan_amount,
        "scheme_name":    "PMEGP",  # placeholder until Shakha runs
        "emi":            emi,
        "verdict":        verdict,
        "summary": (
            f"Your {biz.business_idea} business in {biz.village} has a "
            f"demand score of {demand_score}/10. "
            f"Verdict: {verdict}. Estimated monthly EMI: ₹{emi}."
        ),
        "csr_opportunities": [
            "Tata Trusts — Rural Livelihood Grant",
            "HDFC Parivartan — Micro-enterprise Support",
        ],
        "post_approval_steps": [
            "Open a dedicated business bank account",
            "Register on Udyam portal (MSME registration)",
            "Set up accounting & GST (if applicable)",
            "Hire local help and begin operations",
            "Apply for government subsidy release",
        ],
    }
