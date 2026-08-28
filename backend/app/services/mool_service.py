from sqlalchemy.orm import Session


def calculate_financials(data: dict, db: Session) -> dict:
    """
    Mool Service — Financial calculation engine.
    Computes loan amount (90% of project cost), EMI using reducing balance method,
    total interest, and working capital requirement.
    """
    total_cost    = data["total_project_cost"]
    own_capital   = data["own_capital"]
    tenure        = data["tenure_months"]

    # Core calculations
    loan_amount     = round(total_cost * 0.90, 2)          # 90% of total cost
    working_capital = round(total_cost - loan_amount - own_capital, 2)

    # Interest rate — default 7% p.a. (PMEGP rate), overridable via scheme
    annual_rate   = 7.0
    monthly_rate  = annual_rate / (12 * 100)

    # EMI formula: [P × r × (1+r)^n] / [(1+r)^n - 1]
    if monthly_rate > 0 and tenure > 0:
        factor = (1 + monthly_rate) ** tenure
        emi    = round((loan_amount * monthly_rate * factor) / (factor - 1), 2)
    else:
        emi = round(loan_amount / tenure, 2) if tenure else 0

    total_payment   = round(emi * tenure, 2)
    total_interest  = round(total_payment - loan_amount, 2)

    # Simple repayment schedule (first 3 + last month as sample)
    schedule = []
    balance = loan_amount
    for month in range(1, tenure + 1):
        interest_part   = round(balance * monthly_rate, 2)
        principal_part  = round(emi - interest_part, 2)
        balance         = round(balance - principal_part, 2)
        if month <= 3 or month == tenure:
            schedule.append({
                "month":          month,
                "emi":            emi,
                "principal":      principal_part,
                "interest":       interest_part,
                "balance":        max(balance, 0),
            })

    return {
        "loan_amount":        loan_amount,
        "emi":                emi,
        "interest_rate":      annual_rate,
        "total_interest":     total_interest,
        "working_capital":    working_capital,
        "repayment_schedule": schedule,
    }
