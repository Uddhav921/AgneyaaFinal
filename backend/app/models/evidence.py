from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Evidence(Base):
    __tablename__ = "evidences"

    id              = Column(Integer, primary_key=True, index=True)
    business_id     = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    # Market feasibility data from Beej analysis
    demand_score    = Column(Float, nullable=True)       # 0-10
    competition     = Column(String, nullable=True)      # low | medium | high
    avg_price       = Column(Float, nullable=True)
    customer_base   = Column(Text, nullable=True)
    opportunities   = Column(Text, nullable=True)
    risks           = Column(Text, nullable=True)
    feasibility     = Column(String, nullable=True)      # viable | marginal | not viable
    ai_summary      = Column(Text, nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
