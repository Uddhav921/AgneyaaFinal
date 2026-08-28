from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id          = Column(Integer, primary_key=True, index=True)
    google_id   = Column(String, unique=True, index=True, nullable=True)
    name        = Column(String, nullable=False)
    email       = Column(String, unique=True, index=True, nullable=False)
    language    = Column(String, default="en")          # selected language
    consent     = Column(Boolean, default=False)        # data usage consent
    village     = Column(String, nullable=True)
    block       = Column(String, nullable=True)
    district    = Column(String, nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())
