from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3306/agneyaa")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # auto-reconnect if connection drops
    pool_recycle=1800,       # recycle connections every 30 min
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency — inject DB session into routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> dict:
    """Test MySQL connectivity. Returns status dict."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "connected", "database": DATABASE_URL.split("/")[-1]}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
