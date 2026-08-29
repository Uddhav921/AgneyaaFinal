"""
Beej Service — Conversational Business Analysis powered by Gemini LLM.
Fetches live data from India Post PIN API, OSM Overpass, and Agmarknet
then combines User Input + Dataset Data + Gemini Reasoning → Business Analysis.
"""
import os
import json
import asyncio
import httpx
from typing import AsyncGenerator
from pathlib import Path
from dotenv import dotenv_values

import google.genai as genai
from google.genai import types as genai_types

# ── Config ────────────────────────────────────────────────────────
_ENV = dotenv_values(Path(__file__).resolve().parents[2] / ".env")
GEMINI_API_KEY     = _ENV.get("GEMINI_API_KEY", "")
DATA_GOV_API_KEY   = _ENV.get("DATA_GOV_API_KEY", "")

client = genai.Client(api_key=GEMINI_API_KEY)


# ── Dataset API helpers ───────────────────────────────────────────

async def fetch_postal_data(village: str, district: str, pincode: str = "") -> dict:
    """
    India Post PIN–Village Directory.
    Returns location metadata: block, district, state.
    """
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            if pincode:
                url = f"https://api.postalpincode.in/pincode/{pincode}"
            else:
                url = f"https://api.postalpincode.in/postoffice/{village.replace(' ', '%20')}"

            r = await client.get(url)
            data = r.json()
            if data and data[0].get("Status") == "Success":
                offices = data[0].get("PostOffice", [])
                if offices:
                    # prefer district match
                    match = next(
                        (o for o in offices if district.lower() in o.get("District", "").lower()),
                        offices[0]
                    )
                    return {
                        "source": "India Post PIN Directory",
                        "evidence_type": "Verified",
                        "block": match.get("Block", ""),
                        "district": match.get("District", district),
                        "state": match.get("State", ""),
                        "circle": match.get("Circle", ""),
                        "pincode": match.get("Pincode", pincode),
                    }
    except Exception as e:
        pass
    return {"source": "India Post PIN Directory", "evidence_type": "Unavailable", "state": "Unknown"}


async def fetch_osm_competitors(lat: float, lon: float, category: str) -> dict:
    """
    OSM Overpass API — competitor POI count within 5km of given coordinates.
    Maps business category to OSM tags.
    """
    CATEGORY_OSM_MAP = {
        "agriculture":  '[\"shop\"~\"farm|agricultural\"]',
        "retail":       '[\"shop\"~\"convenience|general|supermarket\"]',
        "food":         '[\"shop\"~\"food|deli|bakery\"]',
        "handicraft":   '[\"shop\"~\"craft|art|handicraft\"]',
        "dairy":        '[\"shop\"~\"dairy|milk\"]',
        "services":     '[\"shop\"~\"repair|service\"]',
        "tailoring":    '[\"shop\"~\"tailor|clothes|fabric\"]',
        "transport":    '[\"amenity\"~\"car_rental|taxi\"]',
        "beauty":       '[\"shop\"~\"beauty|hairdresser|cosmetics\"]',
        "education":    '[\"amenity\"~\"school|college|library\"]',
        "technology":   '[\"shop\"~\"electronics|computer|mobile_phone\"]',
        "construction": '[\"shop\"~\"hardware|doityourself|building_materials\"]',
    }
    tag_filter = CATEGORY_OSM_MAP.get(category, '[\"shop\"]')
    query = f"""
[out:json];
(
  node{tag_filter}(around:5000,{lat},{lon});
  way{tag_filter}(around:5000,{lat},{lon});
);
out count;
"""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                "https://overpass-api.de/api/interpreter",
                data={"data": query},
            )
            data = r.json()
            count = data.get("elements", [{}])[0].get("tags", {}).get("total", 0)
            if count == 0 and data.get("elements"):
                count = len(data["elements"])
            return {
                "source": "OpenStreetMap Overpass API",
                "evidence_type": "Verified",
                "evidence_location_level": "point (5km radius)",
                "competitor_count": int(count),
                "category": category,
            }
    except Exception:
        pass
    return {
        "source": "OpenStreetMap Overpass API",
        "evidence_type": "Unavailable",
        "competitor_count": None,
    }


async def fetch_agmarknet_prices(commodity: str, state: str, district: str) -> dict:
    """
    Agmarknet daily mandi prices via data.gov.in.
    Resource ID: 35985678-0d79-46b4-9ed6-6f13308a1d24
    """
    CATEGORY_COMMODITY_MAP = {
        "agriculture":  "Onion",
        "dairy":        "Milk",
        "food":         "Wheat",
        "handicraft":   None,
        "retail":       "Rice",
        "tailoring":    "Cotton",
        "transport":    None,
        "beauty":       None,
        "education":    None,
        "technology":   None,
        "construction": "Sand",
        "services":     None,
    }
    mapped_commodity = CATEGORY_COMMODITY_MAP.get(commodity, None)
    if not mapped_commodity or not DATA_GOV_API_KEY:
        return {"source": "Agmarknet/data.gov.in", "evidence_type": "Unavailable", "price": None}

    url = (
        "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24"
        f"?api-key={DATA_GOV_API_KEY}&format=json&limit=5"
        f"&filters[state]={state}&filters[district]={district}"
        f"&filters[commodity]={mapped_commodity}"
    )
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url)
            data = r.json()
            records = data.get("records", [])
            if records:
                rec = records[0]
                return {
                    "source": "Agmarknet / data.gov.in",
                    "evidence_type": "Verified",
                    "commodity": mapped_commodity,
                    "market": rec.get("market", district),
                    "modal_price": rec.get("modal_price", "N/A"),
                    "min_price": rec.get("min_price", "N/A"),
                    "max_price": rec.get("max_price", "N/A"),
                    "price_date": rec.get("arrival_date", "recent"),
                }
    except Exception:
        pass
    return {
        "source": "Agmarknet/data.gov.in",
        "evidence_type": "Unavailable",
        "commodity": mapped_commodity,
        "price": None,
    }


# ── Lat/Lon estimation from district name ─────────────────────────

DISTRICT_COORDS = {
    "pune": (18.52, 73.85),
    "mumbai": (19.07, 72.87),
    "nashik": (19.99, 73.79),
    "nagpur": (21.15, 79.09),
    "aurangabad": (19.87, 75.34),
    "delhi": (28.61, 77.20),
    "bangalore": (12.97, 77.59),
    "hyderabad": (17.38, 78.47),
    "chennai": (13.08, 80.27),
    "kolkata": (22.57, 88.36),
    "ahmedabad": (23.02, 72.57),
    "jaipur": (26.91, 75.79),
    "lucknow": (26.85, 80.95),
    "bhopal": (23.25, 77.41),
    "patna": (25.59, 85.13),
}

def estimate_coords(district: str) -> tuple[float, float]:
    key = district.strip().lower()
    return DISTRICT_COORDS.get(key, (20.59, 78.96))  # India center as fallback


# ── System Prompt Builder ─────────────────────────────────────────

def build_system_prompt(business_context: dict, dataset_data: dict) -> str:
    """
    Constructs a rich Gemini system prompt that combines:
    - User's business context (from InputForm)
    - Live dataset evidence
    - Beej AI persona instructions
    """
    bc = business_context
    postal = dataset_data.get("postal", {})
    osm    = dataset_data.get("osm", {})
    prices = dataset_data.get("prices", {})

    osm_info = (
        f"Competitor POI count (OSM, 5km radius): {osm['competitor_count']}"
        if osm.get("competitor_count") is not None
        else "Competitor POI data: Not available from OSM for this location"
    )

    price_info = (
        f"Commodity price data ({prices.get('commodity','N/A')}) at {prices.get('market','nearest mandi')}: "
        f"Modal ₹{prices.get('modal_price','N/A')}/quintal, Range ₹{prices.get('min_price','N/A')}–₹{prices.get('max_price','N/A')} "
        f"(as of {prices.get('price_date','recent')})"
        if prices.get("modal_price") not in (None, "N/A", "Unavailable")
        else "Mandi price data: Not available for this category from Agmarknet"
    )

    state_info = postal.get("state", bc.get("district", "the region"))

    system = f"""You are Beej, an expert AI business advisor for rural Indian entrepreneurs, built for the Agneyaa platform (SIH 2026). Your name is Beej (meaning "seed" — you help entrepreneurs plant and grow their business). You are warm, practical, and deeply knowledgeable about rural Indian markets, government schemes, and local entrepreneurship.

## USER'S BUSINESS CONTEXT (provided by user — treat as User Data 🔵)
- **Name**: {bc.get('full_name', 'Entrepreneur')}
- **Location**: {bc.get('village', '')}, {bc.get('block', '')}, {bc.get('district', '')}, {state_info}
- **Business Category**: {bc.get('category', 'General')}
- **Business Idea**: {bc.get('business_idea', 'Not specified')}
- **Available Capital (Margin Money)**: ₹{bc.get('own_capital', 'Not specified')}
- **Caste/Social Category**: {bc.get('caste_category', 'Not specified')}
- **Land Ownership**: {bc.get('land_owned', 'Not specified')}
- **Target Customers**: {bc.get('target_customers', 'Not specified')}

## DATASET / API EVIDENCE (fetched from real APIs — treat as API Data 🟢)
- **Location Resolved**: {postal.get('block','')}, {postal.get('district', bc.get('district',''))}, {postal.get('state', '')} — Source: {postal.get('source','India Post')} [{postal.get('evidence_type','Estimated')}]
- **{osm_info}** — Source: {osm.get('source','OSM')} [{osm.get('evidence_type','Estimated')}]
- **{price_info}** — Source: {prices.get('source','Agmarknet')} [{prices.get('evidence_type','Estimated')}]

## KEY GOVERNMENT SCHEMES (embedded knowledge — treat as Estimated 🟡)
- **PMEGP**: Project cost up to ₹25L (manufacturing) / ₹10L (service). Margin money 5–10% for SC/ST/OBC/women/minorities. Interest rate ~6–8%.
- **MUDRA – Shishu**: Up to ₹50,000 for micro startups
- **MUDRA – Kishore**: ₹50,000–₹5L for growing businesses
- **MUDRA – Tarun**: ₹5L–₹10L for established small businesses
- **NSFDC**: For SC entrepreneurs — project cost up to ₹30L, concessional interest 6%
- **NBCFDC**: For OBC entrepreneurs — up to ₹15L at 6–8% interest
- **NSKFDC**: For nomadic/denotified tribes — up to ₹5L
- **Stand-Up India**: For SC/ST/Women entrepreneurs — ₹10L to ₹1Cr composite loan

## NABARD NAFIS RURAL INCOME CONTEXT (estimated 🟡)
- State avg rural household income: ~₹1,20,000–₹1,50,000/year
- Rural borrowing behavior: Moderate financial inclusion in most states
- Census data note: Demographic data is from Census 2011 (~15 years stale — treat as structural context only)

## YOUR BEHAVIOR RULES
1. **Always label your information sources** using these markers:
   - 🟢 **API Data** — from real dataset/API calls above
   - 🔵 **User Data** — from the user's form inputs
   - 🟡 **Estimated** — from your reasoning, embedded knowledge, or NABARD/scheme rules

2. **Never make up specific numbers** without labeling them as 🟡 Estimated. If you don't have data, say so clearly and explain why.

3. **Be conversational, not a report generator**. Keep responses focused, warm, and practical. Use bullet points for lists but keep text flowing naturally.

4. **Dynamically understand questions**. If the user asks about competitors, give competition analysis. If they ask about loans, calculate EMI using: EMI = P × r × (1+r)^n / ((1+r)^n − 1).

5. **After every response**, mentally note 3–4 follow-up questions that would naturally come next based on what you just discussed. These will be shown as suggestion chips to the user.

6. **Language**: Respond in English by default. If the user writes in Hindi, respond in Hindi.

7. **For financial calculations**:
   - Always show the formula/logic
   - Label all inputs as 🔵 User Data or 🟡 Estimated
   - If using scheme rates, label as 🟡 Estimated (verify before final application)

8. **For scheme matching**: Check user's caste_category and business_category against the scheme rules above and highlight the BEST matches first.

Begin each conversation with a warm, practical first analysis covering: market opportunity, financial quick-check, and the top matching government scheme. Then ask one specific clarifying question to deepen the analysis."""

    return system


# ── Follow-up Question Generator ─────────────────────────────────

async def generate_followup_questions(
    business_context: dict,
    conversation_history: list[dict],
    last_response: str,
) -> list[str]:
    """
    Generates 4 contextual follow-up question chips based on the conversation so far.
    Uses a separate fast Gemini call.
    """
    try:
        bc = business_context
        history_summary = "\n".join([
            f"{'User' if m['role'] == 'user' else 'Beej'}: {m['content'][:200]}"
            for m in conversation_history[-6:]
        ])

        prompt = f"""Based on this business consultation conversation, generate exactly 4 short follow-up questions that the user might want to ask next. These should be natural, specific to their business, and cover different aspects (financial, competition, schemes, local opportunities, risks, documents etc.).

Business: {bc.get('business_idea', '')} in {bc.get('village', '')}, {bc.get('district', '')}
Category: {bc.get('category', '')}
Capital: ₹{bc.get('own_capital', '')}

Recent conversation:
{history_summary}

Last Beej response (summary): {last_response[:300]}

Output ONLY a JSON array of 4 short question strings (each under 60 characters). No explanations, no markdown.
Example: ["What is my expected monthly profit?", "Which scheme should I apply for?", "Who are my main competitors?", "What documents do I need?"]"""

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
        )
        text = response.text.strip()

        # Parse JSON
        if text.startswith("["):
            questions = json.loads(text)
            return questions[:4]
        # Try to extract JSON array from response
        import re
        match = re.search(r'\[.*?\]', text, re.DOTALL)
        if match:
            questions = json.loads(match.group())
            return questions[:4]
    except Exception:
        pass

    # Fallback questions based on category
    fallback = {
        "agriculture":  ["What is the demand for my crops locally?", "Which mandi should I sell at?", "Can I get PM-KISAN benefits?", "What are my biggest risks?"],
        "dairy":        ["How many liters can I sell daily?", "What government dairy schemes exist?", "What is the milk price in my area?", "How much profit can I expect?"],
        "food":         ["What is the FSSAI registration process?", "Who are my main competitors?", "What is my expected monthly profit?", "Which scheme gives the best loan?"],
        "retail":       ["How many customers can I serve daily?", "What is my break-even timeline?", "Which government scheme fits me?", "What licenses do I need?"],
        "default":      ["What is my expected monthly profit?", "Which scheme should I apply for?", "Who are my main competitors?", "What documents do I need to start?"],
    }
    cat = business_context.get("category", "default")
    return fallback.get(cat, fallback["default"])


# ── Main Streaming Chat Function ──────────────────────────────────

async def stream_beej_chat(
    business_context: dict,
    conversation_history: list[dict],
    user_message: str,
    dataset_data: dict,
) -> AsyncGenerator[str, None]:
    """
    Streams Gemini response as SSE events.
    Yields: "data: <json>\n\n" chunks for token stream
    Final: "data: [DONE]\n\n"
    """
    try:
        system_prompt = build_system_prompt(business_context, dataset_data)

        # Build contents list for google-genai SDK
        contents = []
        for msg in conversation_history:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(
                genai_types.Content(
                    role=role,
                    parts=[genai_types.Part(text=msg["content"])],
                )
            )
        # Add the current user message
        contents.append(
            genai_types.Content(
                role="user",
                parts=[genai_types.Part(text=user_message)],
            )
        )

        # Real streaming: run synchronous Gemini stream in a thread,
        # push each chunk into an async queue as it arrives.
        import queue as _queue
        import threading

        chunk_queue: asyncio.Queue = asyncio.Queue()
        loop = asyncio.get_event_loop()

        def _sync_stream():
            try:
                for chunk in client.models.generate_content_stream(
                    model="gemini-3.6-flash",
                    contents=contents,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.7,
                        max_output_tokens=1500,
                    ),
                ):
                    loop.call_soon_threadsafe(chunk_queue.put_nowait, chunk)
            except Exception as exc:
                loop.call_soon_threadsafe(chunk_queue.put_nowait, exc)
            finally:
                loop.call_soon_threadsafe(chunk_queue.put_nowait, None)  # sentinel

        thread = threading.Thread(target=_sync_stream, daemon=True)
        thread.start()

        full_text = ""
        while True:
            item = await chunk_queue.get()
            if item is None:
                break  # sentinel — streaming complete
            if isinstance(item, Exception):
                raise item
            chunk = item
            if chunk.text:
                full_text += chunk.text
                payload = json.dumps({"type": "token", "text": chunk.text})
                yield f"data: {payload}\n\n"

        thread.join(timeout=5)

        # Generate follow-up questions after streaming completes
        updated_history = conversation_history + [
            {"role": "user",      "content": user_message},
            {"role": "assistant", "content": full_text},
        ]
        followups = await generate_followup_questions(
            business_context, updated_history, full_text
        )

        payload = json.dumps({"type": "followups", "questions": followups})
        yield f"data: {payload}\n\n"
        yield "data: [DONE]\n\n"

    except Exception as e:
        error_payload = json.dumps({"type": "error", "text": f"Beej encountered an error: {str(e)}"})
        yield f"data: {error_payload}\n\n"
        yield "data: [DONE]\n\n"


# ── Initial Analysis (first message) ─────────────────────────────

async def fetch_all_dataset_data(business_context: dict) -> dict:
    """
    Fetches all relevant dataset API data for a business context in parallel.
    Returns a structured dict with postal, osm, and prices data.
    """
    bc = business_context
    village  = bc.get("village", "")
    district = bc.get("district", "")
    category = bc.get("category", "retail")

    lat, lon = estimate_coords(district)

    # Fetch all data sources concurrently
    postal_task = fetch_postal_data(village, district)
    osm_task    = fetch_osm_competitors(lat, lon, category)
    prices_task = fetch_agmarknet_prices(category, bc.get("state", ""), district)

    postal, osm, prices = await asyncio.gather(postal_task, osm_task, prices_task)

    return {
        "postal": postal,
        "osm":    osm,
        "prices": prices,
        "lat":    lat,
        "lon":    lon,
    }


async def stream_initial_analysis(
    business_context: dict,
    dataset_data: dict,
) -> AsyncGenerator[str, None]:
    """
    Generates the first Beej message: a comprehensive initial business analysis.
    """
    bc = business_context
    initial_prompt = f"""Please analyse my business idea and give me a comprehensive initial assessment.

My details:
- Business idea: {bc.get('business_idea', 'Not specified')}
- Location: {bc.get('village', '')}, {bc.get('district', '')}
- Category: {bc.get('category', '')}
- My available capital: ₹{bc.get('own_capital', '')}
- Caste category: {bc.get('caste_category', '')}
- Land: {bc.get('land_owned', '')}
- Target customers: {bc.get('target_customers', '')}

Please cover:
1. Market opportunity and demand outlook for my location
2. Quick financial check (can I start with ₹{bc.get('own_capital','')}, what loan might I need)
3. Best government scheme(s) I qualify for given my social category
4. Top 2 risks to watch out for
5. One specific clarifying question that would help you give me even better advice

Keep it practical and conversational. Use the source labels (🟢/🔵/🟡) for each piece of information."""

    async for chunk in stream_beej_chat(business_context, [], initial_prompt, dataset_data):
        yield chunk


# ── Legacy: run_beej_analysis (kept for /beej/analyse backward compat) ──

async def run_beej_analysis(data: dict, db) -> dict:
    """Legacy stub — returns a basic analysis. Use stream_beej_chat for new code."""
    from sqlalchemy.orm import Session
    from app.models.evidence import Evidence

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

    try:
        ev = Evidence(business_id=data["business_id"], **result)
        db.add(ev)
        db.commit()
        db.refresh(ev)
    except Exception:
        pass

    return result


# ── Business Report Generator ─────────────────────────────────────

async def create_business_report(
    business_context: dict,
    conversation_history: list[dict],
    dataset_data: dict,
) -> str:
    """
    Analyzes the full conversation, extracts key insights, and generates
    a structured Markdown Business Feasibility Report.
    Does NOT dump chat history — only synthesized knowledge.
    Uses the LATEST confirmed information if the user updated any details.
    """
    from datetime import date
    system_prompt = build_system_prompt(business_context, dataset_data)

    # Build conversation contents
    contents = []
    for msg in conversation_history:
        role = "user" if msg["role"] == "user" else "model"
        contents.append(
            genai_types.Content(
                role=role,
                parts=[genai_types.Part(text=msg["content"])],
            )
        )

    today = date.today().strftime("%d %B %Y")
    bc    = business_context

    report_request = f"""Based on our entire conversation so far, generate a professional **Business Feasibility Report** for this entrepreneur.

STRICT INSTRUCTIONS:
- Extract and synthesize ONLY the important information from our conversation: confirmed business requirements, key decisions made, market analysis findings, financial data discussed, government schemes identified, risk factors, and recommendations
- If the user provided UPDATED information at any point in the conversation, use only the LATEST confirmed version — discard older/contradicted data
- Do NOT copy-paste or quote chat messages directly
- Write as a formal, structured report (not a conversation)
- Be specific with numbers where available; label all data sources

FORMAT the report EXACTLY as follows (use proper Markdown):

# 🌱 Business Feasibility Report
**Prepared by Beej AI · Agneyaa Platform**
*{today}*

---

## 📋 Executive Summary
[2–3 sentences: what the business is, overall feasibility verdict, top opportunity or risk]

---

## 🏢 Business Profile
| Field | Details |
|---|---|
| **Entrepreneur** | {bc.get('full_name', 'N/A')} |
| **Business Idea** | {bc.get('business_idea', 'N/A')} |
| **Category** | {bc.get('category', 'N/A')} |
| **Location** | {bc.get('village', '')}, {bc.get('block', '')}, {bc.get('district', '')} |
| **Available Capital** | ₹{bc.get('own_capital', 'N/A')} |
| **Land Ownership** | {bc.get('land_owned', 'N/A')} |
| **Caste Category** | {bc.get('caste_category', 'N/A')} |
| **Target Customers** | {bc.get('target_customers', 'N/A')} |

---

## 📊 Market Analysis
[Synthesize all market insights from the conversation. Label each point:]
- 🟢 **API Data**: [facts from OSM/Agmarknet/India Post]
- 🔵 **User Data**: [facts the user confirmed]
- 🟡 **Estimated**: [Gemini-reasoned estimates]

---

## 💰 Financial Overview
[Synthesize financial data discussed: capital, loan need, EMI estimates, working capital, break-even if discussed]

---

## 🏛️ Government Schemes
[Top 1–3 matched schemes with: scheme name, key benefit, why this user qualifies]

---

## ⚠️ Risk Assessment
| Risk Factor | Severity | Suggested Mitigation |
|---|---|---|

---

## ✅ Action Plan
List the concrete next steps in order:
1. [First immediate action]
2. ...

---

## 🎯 Final Recommendation
**Verdict**: [GO / CONDITIONAL GO / NEEDS MORE STUDY]

[2–3 sentences with the key reasoning for the verdict]

---
*Data Sources: 🟢 API (India Post, OSM Overpass, Agmarknet) · 🔵 User Provided · 🟡 Gemini Estimated*"""

    contents.append(
        genai_types.Content(
            role="user",
            parts=[genai_types.Part(text=report_request)],
        )
    )

    response = await asyncio.to_thread(
        lambda: client.models.generate_content(
            model="gemini-3.6-flash",
            contents=contents,
            config=genai_types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.3,
                max_output_tokens=2500,
            ),
        )
    )
    return response.text
