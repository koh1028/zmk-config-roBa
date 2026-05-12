import os
import tempfile
from datetime import date, datetime
from typing import List, Optional
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from database import get_db, init_db
from models import (
    Transaction, TransactionUpdate,
    ManualExpense,
    Debt, DebtUpdate,
    SimulationParams, SimulationResult, MonthlySimPoint,
    ExpenseCategory,
)
from pdf_parser import parse_pdf

app = FastAPI(title="家計簿API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


# ─── Transactions ────────────────────────────────────────────────────────────

@app.get("/api/transactions", response_model=List[Transaction])
def list_transactions(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
):
    conn = get_db()
    query = "SELECT * FROM transactions WHERE 1=1"
    params: list = []

    if year:
        query += " AND strftime('%Y', date) = ?"
        params.append(str(year))
    if month:
        query += " AND strftime('%m', date) = ?"
        params.append(f"{month:02d}")
    if category:
        query += " AND category = ?"
        params.append(category)
    if source:
        query += " AND source = ?"
        params.append(source)

    query += " ORDER BY date DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/transactions/upload", response_model=List[Transaction])
async def upload_pdf(
    file: UploadFile = File(...),
    source_name: str = Query("クレジットカード"),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDFファイルのみアップロード可能です")

    content = await file.read()
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        transactions = parse_pdf(tmp_path, source_name)
    finally:
        os.unlink(tmp_path)

    if not transactions:
        raise HTTPException(status_code=422, detail="PDFから取引データを抽出できませんでした")

    conn = get_db()
    saved = []
    for t in transactions:
        # Skip duplicates
        exists = conn.execute(
            "SELECT id FROM transactions WHERE date=? AND description=? AND amount=? AND source=?",
            (t.date, t.description, t.amount, t.source),
        ).fetchone()
        if exists:
            continue
        cur = conn.execute(
            "INSERT INTO transactions (date, description, amount, category, source, is_manual) VALUES (?,?,?,?,?,0)",
            (t.date, t.description, t.amount, t.category.value, t.source),
        )
        t.id = cur.lastrowid
        saved.append(t)
    conn.commit()
    conn.close()
    return saved


@app.patch("/api/transactions/{transaction_id}", response_model=Transaction)
def update_transaction(transaction_id: int, body: TransactionUpdate):
    conn = get_db()
    conn.execute(
        "UPDATE transactions SET category=? WHERE id=?",
        (body.category.value, transaction_id),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM transactions WHERE id=?", (transaction_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="取引が見つかりません")
    return dict(row)


@app.delete("/api/transactions/{transaction_id}")
def delete_transaction(transaction_id: int):
    conn = get_db()
    conn.execute("DELETE FROM transactions WHERE id=?", (transaction_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


# ─── Manual Expenses ─────────────────────────────────────────────────────────

@app.get("/api/manual-expenses", response_model=List[ManualExpense])
def list_manual_expenses():
    conn = get_db()
    rows = conn.execute("SELECT * FROM manual_expenses ORDER BY id").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/manual-expenses", response_model=ManualExpense)
def create_manual_expense(expense: ManualExpense):
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO manual_expenses (name, amount, category, day_of_month, is_recurring, start_date, end_date) VALUES (?,?,?,?,?,?,?)",
        (expense.name, expense.amount, expense.category.value, expense.day_of_month,
         int(expense.is_recurring), expense.start_date, expense.end_date),
    )
    expense.id = cur.lastrowid
    conn.commit()
    conn.close()
    return expense


@app.put("/api/manual-expenses/{expense_id}", response_model=ManualExpense)
def update_manual_expense(expense_id: int, expense: ManualExpense):
    conn = get_db()
    conn.execute(
        "UPDATE manual_expenses SET name=?, amount=?, category=?, day_of_month=?, is_recurring=?, start_date=?, end_date=? WHERE id=?",
        (expense.name, expense.amount, expense.category.value, expense.day_of_month,
         int(expense.is_recurring), expense.start_date, expense.end_date, expense_id),
    )
    conn.commit()
    conn.close()
    expense.id = expense_id
    return expense


@app.delete("/api/manual-expenses/{expense_id}")
def delete_manual_expense(expense_id: int):
    conn = get_db()
    conn.execute("DELETE FROM manual_expenses WHERE id=?", (expense_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


# ─── Debts ────────────────────────────────────────────────────────────────────

@app.get("/api/debts", response_model=List[Debt])
def list_debts():
    conn = get_db()
    rows = conn.execute("SELECT * FROM debts ORDER BY id").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/debts", response_model=Debt)
def create_debt(debt: Debt):
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO debts (name, principal, interest_rate, monthly_payment, start_date) VALUES (?,?,?,?,?)",
        (debt.name, debt.principal, debt.interest_rate, debt.monthly_payment, debt.start_date),
    )
    debt.id = cur.lastrowid
    conn.commit()
    conn.close()
    return debt


@app.put("/api/debts/{debt_id}", response_model=Debt)
def update_debt(debt_id: int, debt: Debt):
    conn = get_db()
    conn.execute(
        "UPDATE debts SET name=?, principal=?, interest_rate=?, monthly_payment=?, start_date=? WHERE id=?",
        (debt.name, debt.principal, debt.interest_rate, debt.monthly_payment, debt.start_date, debt_id),
    )
    conn.commit()
    conn.close()
    debt.id = debt_id
    return debt


@app.delete("/api/debts/{debt_id}")
def delete_debt(debt_id: int):
    conn = get_db()
    conn.execute("DELETE FROM debts WHERE id=?", (debt_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


# ─── Simulation ───────────────────────────────────────────────────────────────

@app.post("/api/simulate", response_model=SimulationResult)
def simulate_repayment(params: SimulationParams):
    conn = get_db()
    row = conn.execute("SELECT * FROM debts WHERE id=?", (params.debt_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="ローンが見つかりません")

    debt = dict(row)
    balance = float(debt["principal"])
    annual_rate = float(debt["interest_rate"])
    monthly_rate = annual_rate / 100 / 12
    base_payment = float(debt["monthly_payment"]) + params.extra_monthly

    start = datetime.fromisoformat(debt["start_date"])
    current = date(start.year, start.month, 1)

    schedule: List[MonthlySimPoint] = []
    total_interest = 0.0
    total_paid = 0.0
    max_months = 600  # 50-year guard

    while balance > 0 and len(schedule) < max_months:
        interest = balance * monthly_rate
        payment = base_payment
        if current.month in params.bonus_months and params.bonus_amount > 0:
            payment += params.bonus_amount

        if payment > balance + interest:
            payment = balance + interest

        principal_paid = payment - interest
        balance = max(0.0, balance - principal_paid)
        total_interest += interest
        total_paid += payment

        schedule.append(MonthlySimPoint(
            month=current.strftime("%Y-%m"),
            remaining_balance=round(balance, 0),
            monthly_payment=round(payment, 0),
            interest_paid=round(interest, 0),
            principal_paid=round(principal_paid, 0),
        ))

        if balance == 0:
            break

        # Next month
        month = current.month + 1
        year = current.year
        if month > 12:
            month = 1
            year += 1
        current = date(year, month, 1)

    payoff_date = schedule[-1].month if schedule else "不明"

    return SimulationResult(
        schedule=schedule,
        total_interest=round(total_interest, 0),
        payoff_date=payoff_date,
        total_paid=round(total_paid, 0),
        months_count=len(schedule),
    )


# ─── Summary ──────────────────────────────────────────────────────────────────

@app.get("/api/summary")
def get_summary(year: int = Query(...), month: int = Query(...)):
    conn = get_db()
    ym = f"{year}-{month:02d}"

    # Transactions this month
    rows = conn.execute(
        "SELECT category, SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? GROUP BY category",
        (ym,),
    ).fetchall()
    by_category = {r["category"]: r["total"] for r in rows}

    # Monthly total
    total_row = conn.execute(
        "SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ?",
        (ym,),
    ).fetchone()
    total = total_row["total"] or 0

    # Monthly breakdown over last 12 months
    monthly_rows = conn.execute(
        """
        SELECT strftime('%Y-%m', date) as ym, SUM(amount) as total
        FROM transactions
        WHERE date >= date('now', '-12 months')
        GROUP BY ym
        ORDER BY ym
        """,
    ).fetchall()
    monthly_trend = [{"month": r["ym"], "total": r["total"]} for r in monthly_rows]

    # Manual expenses
    manual_rows = conn.execute("SELECT SUM(amount) as total FROM manual_expenses WHERE is_recurring=1").fetchone()
    manual_total = manual_rows["total"] or 0

    # Sources
    source_rows = conn.execute(
        "SELECT source, COUNT(*) as count, SUM(amount) as total FROM transactions GROUP BY source",
    ).fetchall()
    sources = [dict(r) for r in source_rows]

    conn.close()
    return {
        "year": year,
        "month": month,
        "total_transactions": total,
        "manual_monthly": manual_total,
        "grand_total": total + manual_total,
        "by_category": by_category,
        "monthly_trend": monthly_trend,
        "sources": sources,
    }
