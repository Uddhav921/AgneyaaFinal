import json
from sqlalchemy.orm import Session
from app.models.scheme import Scheme


def match_scheme(data: dict, db: Session) -> dict | None:
    """
    Shakha Service — Selects the best-matching government loan scheme
    based on business category, loan amount, and user profile.
    """
    loan_amount = data["loan_amount"]
    category    = data["category"].lower()

    # Query schemes within loan range
    schemes = db.query(Scheme).filter(Scheme.max_loan >= loan_amount).all()

    if not schemes:
        return None

    # Simple scoring: prefer schemes whose category matches
    best = None
    best_score = -1

    for scheme in schemes:
        score = 0
        if scheme.category and category in scheme.category.lower():
            score += 10
        if scheme.max_loan and scheme.max_loan <= loan_amount * 1.5:
            score += 5   # closer match to loan size
        if score > best_score:
            best_score = score
            best = scheme

    if not best:
        best = schemes[0]   # fallback to first available

    docs = json.loads(best.documents) if best.documents else [
        "Aadhaar Card", "PAN Card", "Passport Photo",
        "Bank Statement (6 months)", "Project Report",
    ]

    return {
        "scheme_id":           best.id,
        "scheme_name":         best.name,
        "interest_rate":       best.interest_rate or 7.0,
        "tenure_months":       best.tenure_months or 60,
        "subsidy":             best.subsidy or "As per scheme guidelines",
        "documents_required":  docs,
        "next_steps": [
            "Visit nearest bank branch with documents",
            "Submit loan application with project report",
            "Await DIC (District Industries Centre) approval",
            "Attend PMEGP EDP training (if applicable)",
            "Receive loan disbursement",
        ],
    }
