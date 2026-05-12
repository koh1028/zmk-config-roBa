from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from enum import Enum


class ExpenseCategory(str, Enum):
    FOOD = "食費"
    TRANSPORT = "交通費"
    UTILITIES = "光熱費・通信"
    ENTERTAINMENT = "娯楽"
    SHOPPING = "ショッピング"
    MEDICAL = "医療"
    INSURANCE = "保険"
    RENT = "家賃"
    LOAN = "ローン・返済"
    OTHER = "その他"


class Transaction(BaseModel):
    id: Optional[int] = None
    date: str
    description: str
    amount: int
    category: ExpenseCategory = ExpenseCategory.OTHER
    source: str
    is_manual: bool = False


class TransactionUpdate(BaseModel):
    category: ExpenseCategory


class ManualExpense(BaseModel):
    id: Optional[int] = None
    name: str
    amount: int
    category: ExpenseCategory
    day_of_month: int
    is_recurring: bool = True
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class Debt(BaseModel):
    id: Optional[int] = None
    name: str
    principal: float
    interest_rate: float
    monthly_payment: float
    start_date: str


class DebtUpdate(BaseModel):
    name: Optional[str] = None
    principal: Optional[float] = None
    interest_rate: Optional[float] = None
    monthly_payment: Optional[float] = None
    start_date: Optional[str] = None


class SimulationParams(BaseModel):
    debt_id: int
    bonus_amount: float = 0
    bonus_months: List[int] = [6, 12]
    extra_monthly: float = 0


class MonthlySimPoint(BaseModel):
    month: str
    remaining_balance: float
    monthly_payment: float
    interest_paid: float
    principal_paid: float


class SimulationResult(BaseModel):
    schedule: List[MonthlySimPoint]
    total_interest: float
    payoff_date: str
    total_paid: float
    months_count: int
