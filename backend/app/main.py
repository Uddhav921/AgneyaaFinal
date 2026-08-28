from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine

# Import all models so SQLAlchemy can resolve FK references before create_all
from app.models import user, business, scheme, evidence, document  # noqa: F401
from app.routes import beej, mool, shakha, chhaya

# Create all tables on startup
Base.metadata.create_all(bind=engine)

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

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(beej.router,   prefix="/api/v1")
app.include_router(mool.router,   prefix="/api/v1")
app.include_router(shakha.router, prefix="/api/v1")
app.include_router(chhaya.router, prefix="/api/v1")


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
