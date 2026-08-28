from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Business(Base):
    __tablename__ = "businesses"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=False)
    business_idea    = Column(String, nullable=False)
    category         = Column(String, nullable=False)   # e.g. agriculture, retail, handicraft
    village          = Column(String, nullable=False)
    block            = Column(String, nullable=False)
    district         = Column(String, nullable=False)
    own_capital      = Column(Float, nullable=False)    # margin money the user has
    total_cost       = Column(Float, nullable=True)     # estimated project cost
    loan_amount      = Column(Float, nullable=True)     # 90% of total cost
    status           = Column(String, default="draft")  # draft | analysed | approved
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
