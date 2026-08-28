from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, check_db_connection

# Import all models so SQLAlchemy can resolve FK references before create_all
from app.models import user, business, scheme, evidence, document  # noqa: F401
from app.routes import beej, mool, shakha, chhaya, auth

# NOTE: We do NOT call Base.metadata.create_all here because the user
# has already created the tables in XAMPP MySQL manually.
# Uncomment the line below only if you want SQLAlchemy to manage tables:
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Agneyaa API",
    description=(
        "Hyper-local AI Business & Financial Advisor for rural entrepreneurs.\n\n"
        "**Flow**: Location + Capital + Idea → Market Analysis (Beej) → "
        "Financial Calculation (Mool) → Scheme Selection (Shakha) → "
        "Feasibility Report (Chhaya)"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────
import os
from dotenv import load_dotenv
load_dotenv()

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────
app.include_router(auth.router,   prefix="/api/v1")
app.include_router(beej.router,   prefix="/api/v1")
app.include_router(mool.router,   prefix="/api/v1")
app.include_router(shakha.router, prefix="/api/v1")
app.include_router(chhaya.router, prefix="/api/v1")


# ── Health Endpoints ──────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {
        "app":     "Agneyaa API",
        "version": "1.0.0",
        "status":  "running",
        "docs":    "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


@app.get("/health/db", tags=["Health"])
def db_health():
    """Tests MySQL (XAMPP) connection and returns status."""
    result = check_db_connection()
    if result["status"] == "error":
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail=result)
    return result
