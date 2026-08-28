import os
from sqlalchemy.orm import Session
from app.models.evidence import Evidence

async def run_beej_analysis(data: dict, db: Session) -> dict:
    """
    Beej Service — Hyper-local market feasibility analysis.
    Uses Gemini AI to analyse demand, competition, pricing,
    opportunities and risks for a given business idea and location.
    """
    # TODO: Replace stub with real Gemini AI call
    # import google.generativeai as genai
    # genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    # model = genai.GenerativeModel("gemini-1.5-flash")
    # prompt = f"""Analyse market feasibility for:
    #   Business: {data['business_idea']}
    #   Location: {data['village']}, {data['block']}, {data['district']}
    #   ...
    # """
    # response = model.generate_content(prompt)

    # Stub response for development
    result = {
        "demand_score":   7.5,
        "competition":    "medium",
        "avg_price":      250.0,
        "customer_base":  f"Approx. 2000 households in {data.get('village', 'the area')}",
        "opportunities":  "Local demand for daily essentials is high. No major competitor within 5km.",
        "risks":          "Seasonal demand fluctuation. Road connectivity may affect supply.",
        "feasibility":    "viable",
        "ai_summary":     (
            f"The {data.get('business_idea')} business in {data.get('village')}, "
            f"{data.get('district')} shows good market potential with a demand score of 7.5/10. "
            "Local competition is medium and pricing is sustainable."
        ),
    }

    # Persist to DB
    ev = Evidence(business_id=data["business_id"], **result)
    db.add(ev)
    db.commit()
    db.refresh(ev)

    return result
