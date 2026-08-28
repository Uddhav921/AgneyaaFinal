from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id              = Column(Integer, primary_key=True, index=True)
    business_id     = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    name            = Column(String, nullable=False)     # e.g. Aadhaar, PAN, Caste Certificate
    status          = Column(String, default="pending")  # pending | submitted | verified
    file_path       = Column(String, nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
