from sqlalchemy import Column, Integer, String, Float, Text
from app.database import Base


class Scheme(Base):
    __tablename__ = "schemes"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String, nullable=False)            # e.g. PM SVANidhi, PMEGP
    ministry        = Column(String, nullable=True)
    category        = Column(String, nullable=True)             # target business category
    max_loan        = Column(Float, nullable=True)              # maximum loan amount
    interest_rate   = Column(Float, nullable=True)              # annual %
    tenure_months   = Column(Integer, nullable=True)
    subsidy         = Column(String, nullable=True)             # subsidy description
    eligibility     = Column(Text, nullable=True)
    documents       = Column(Text, nullable=True)               # JSON string
    description     = Column(Text, nullable=True)
