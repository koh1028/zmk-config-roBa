import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "household_budget.db"


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS transactions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            date        TEXT    NOT NULL,
            description TEXT    NOT NULL,
            amount      INTEGER NOT NULL,
            category    TEXT    NOT NULL DEFAULT 'その他',
            source      TEXT    NOT NULL,
            is_manual   INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS manual_expenses (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            name         TEXT    NOT NULL,
            amount       INTEGER NOT NULL,
            category     TEXT    NOT NULL,
            day_of_month INTEGER NOT NULL,
            is_recurring INTEGER NOT NULL DEFAULT 1,
            start_date   TEXT,
            end_date     TEXT
        );

        CREATE TABLE IF NOT EXISTS debts (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            name            TEXT    NOT NULL,
            principal       REAL    NOT NULL,
            interest_rate   REAL    NOT NULL,
            monthly_payment REAL    NOT NULL,
            start_date      TEXT    NOT NULL
        );
    """)
    conn.commit()
    conn.close()
