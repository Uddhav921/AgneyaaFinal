"""
Beej Routes — Conversational Business Analysis Chat (Gemini-powered).
Endpoints:
  POST /beej/start       → fetch dataset data, returns dataset_context JSON
  POST /beej/chat        → streaming SSE endpoint for ongoing chat
  POST /beej/analyse     → legacy single-shot market analysis (kept for compatibility)
  GET  /beej/result/{id} → retrieve stored analysis
"""
import json
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.services.beej_service import (
    fetch_all_dataset_data,
    stream_initial_analysis,
    stream_beej_chat,
    run_beej_analysis,
    create_business_report,
)

router = APIRouter(prefix="/beej", tags=["Beej — Business Chat (Gemini)"])


# ── Pydantic Schemas ──────────────────────────────────────────────

class BusinessContext(BaseModel):
    full_name:        str = ""
    phone:            str = ""
    village:          str = ""
    block:            str = ""
    district:         str = ""
    state:            str = ""
    business_idea:    str = ""
    own_capital:      str = ""
    category:         str = "retail"
    caste_category:   str = ""
    land_owned:       str = ""
    target_customers: str = ""


class ChatMessage(BaseModel):
    role:    str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    business_context:    BusinessContext
    conversation_history: list[ChatMessage] = []
    user_message:        str
    dataset_data:        dict = {}  # cached from /beej/start


class StartRequest(BaseModel):
    business_context: BusinessContext


class ReportRequest(BaseModel):
    business_context:     BusinessContext
    conversation_history: list[ChatMessage] = []
    dataset_data:         dict = {}


class BeejRequest(BaseModel):
    """Legacy schema for backward compatibility."""
    business_id:   int
    business_idea: str
    category:      str
    village:       str
    block:         str
    district:      str


class BeejResponse(BaseModel):
    demand_score:  float
    competition:   str
    avg_price:     float
    customer_base: str
    opportunities: str
    risks:         str
    feasibility:   str
    ai_summary:    str


# ── Routes ────────────────────────────────────────────────────────

@router.post(
    "/start",
    summary="Initialize Beej chat session — fetch dataset context",
)
async def start_chat(payload: StartRequest):
    """
    Called once when user clicks 'Analyse My Business'.
    Fetches all relevant dataset/API data for the business context.
    Returns the dataset_data JSON to be cached on the frontend and
    sent with every subsequent /beej/chat request.
    Also initiates the first streaming analysis response.
    """
    bc = payload.business_context.dict()
    dataset_data = await fetch_all_dataset_data(bc)

    return {
        "status": "ready",
        "dataset_data": dataset_data,
        "business_context": bc,
    }


@router.post(
    "/chat",
    summary="Stream a Beej chat response (SSE)",
)
async def chat(payload: ChatRequest):
    """
    Streaming SSE endpoint. Returns Server-Sent Events with chunks:
      data: {"type": "token", "text": "..."}
      data: {"type": "followups", "questions": [...]}
      data: [DONE]
    """
    bc      = payload.business_context.dict()
    history = [m.dict() for m in payload.conversation_history]
    msg     = payload.user_message
    dd      = payload.dataset_data

    if not msg.strip():
        raise HTTPException(status_code=400, detail="user_message cannot be empty")

    async def event_stream():
        async for chunk in stream_beej_chat(bc, history, msg, dd):
            yield chunk

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection":    "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post(
    "/chat/initial",
    summary="Stream the first Beej analysis message (SSE)",
)
async def chat_initial(payload: StartRequest):
    """
    Streams the opening business analysis after /beej/start has been called.
    Frontend calls this immediately after receiving dataset_data from /beej/start.
    """
    bc = payload.business_context.dict()
    dataset_data = await fetch_all_dataset_data(bc)

    async def event_stream():
        async for chunk in stream_initial_analysis(bc, dataset_data):
            yield chunk

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection":    "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ── Legacy Endpoint (kept for compatibility) ──────────────────────

@router.post(
    "/analyse",
    response_model=BeejResponse,
    summary="[Legacy] Run single-shot market analysis",
)
async def analyse_market(payload: BeejRequest, db: Session = Depends(get_db)):
    """
    Beej (Seed) — Legacy single-shot market analysis.
    Use /beej/chat for the conversational interface.
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


@router.post(
    "/report",
    summary="Generate a structured Business Feasibility Report from conversation",
)
async def generate_report(payload: ReportRequest):
    """
    Analyzes the full conversation and generates a Markdown-formatted
    Business Feasibility Report — synthesized insights only, no raw chat dump.
    Uses latest confirmed information if user updated any details mid-conversation.
    """
    bc      = payload.business_context.dict()
    history = [m.dict() for m in payload.conversation_history]
    dd      = payload.dataset_data

    if not history:
        raise HTTPException(status_code=400, detail="Conversation history is required to generate a report")

    try:
        report_text = await create_business_report(bc, history, dd)
        return {"report": report_text, "status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")
