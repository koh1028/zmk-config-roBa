import pdfplumber
import re
from datetime import date, datetime
from typing import List, Optional
from models import Transaction, ExpenseCategory


CATEGORY_KEYWORDS: dict[ExpenseCategory, list[str]] = {
    ExpenseCategory.FOOD: [
        "スーパー", "コンビニ", "食", "弁当", "マクドナルド", "すき家", "吉野家",
        "ファミマ", "セブン", "ローソン", "ミニストップ", "デイリー", "松屋",
        "なか卯", "CoCo壱", "サイゼリヤ", "ガスト", "デニーズ", "ジョナサン",
        "RESTAURANT", "restaurant", "CAFE", "cafe", "カフェ", "喫茶",
        "焼肉", "寿司", "ラーメン", "うどん", "蕎麦", "そば", "居酒屋",
        "ピザ", "バーガー", "フード", "food", "FOOD",
    ],
    ExpenseCategory.TRANSPORT: [
        "JR", "電車", "バス", "タクシー", "SUICA", "Suica", "PASMO", "Pasmo",
        "駐車場", "ガソリン", "高速", "ETC", "新幹線", "飛行機", "ANA", "JAL",
        "交通", "TAXI", "taxi", "モノレール", "地下鉄", "メトロ",
    ],
    ExpenseCategory.UTILITIES: [
        "電気", "ガス", "水道", "NHK", "通信", "電話", "インターネット",
        "ドコモ", "au", "ソフトバンク", "楽天モバイル", "UQ", "NURO",
        "フレッツ", "光", "Wi-Fi",
    ],
    ExpenseCategory.ENTERTAINMENT: [
        "映画", "Netflix", "Hulu", "Disney", "Prime Video", "YouTube",
        "カラオケ", "ゲーム", "書籍", "本", "漫画", "DVD", "音楽",
        "Spotify", "Apple Music", "Steam", "PlayStation", "Nintendo",
        "遊園地", "テーマパーク", "映画館",
    ],
    ExpenseCategory.MEDICAL: [
        "病院", "薬局", "クリニック", "歯科", "医院", "調剤", "医療",
        "ドラッグストア", "マツキヨ", "ウェルシア", "ツルハ", "くすりの",
    ],
    ExpenseCategory.INSURANCE: [
        "保険", "生命保険", "損害保険", "火災保険", "自動車保険",
    ],
    ExpenseCategory.RENT: [
        "家賃", "管理費", "駐車場代", "地代",
    ],
    ExpenseCategory.LOAN: [
        "ローン", "返済", "借入", "消費者金融", "カードローン",
    ],
    ExpenseCategory.SHOPPING: [
        "Amazon", "楽天市場", "Yahoo", "ZARA", "ユニクロ", "H&M", "GU",
        "無印", "MUJI", "ニトリ", "イケア", "IKEA", "ビックカメラ",
        "ヨドバシ", "エディオン", "ケーズデンキ", "ヤマダ", "コジマ",
    ],
}


def guess_category(description: str) -> ExpenseCategory:
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword.lower() in description.lower():
                return category
    return ExpenseCategory.OTHER


def parse_date(date_str: str, default_year: int = None) -> Optional[str]:
    if default_year is None:
        default_year = datetime.now().year

    date_str = date_str.strip()

    # YYYY/MM/DD or YYYY-MM-DD
    m = re.match(r'(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})', date_str)
    if m:
        try:
            d = date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
            return d.isoformat()
        except ValueError:
            pass

    # YYYY年MM月DD日
    m = re.match(r'(\d{4})年(\d{1,2})月(\d{1,2})日?', date_str)
    if m:
        try:
            d = date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
            return d.isoformat()
        except ValueError:
            pass

    # MM/DD or MM月DD日
    m = re.match(r'(\d{1,2})[/月](\d{1,2})日?', date_str)
    if m:
        try:
            d = date(default_year, int(m.group(1)), int(m.group(2)))
            return d.isoformat()
        except ValueError:
            pass

    return None


def extract_amount(text: str) -> Optional[int]:
    # Match amounts like 1,234 or 1234 or 1,234円
    patterns = [
        r'(\d{1,3}(?:,\d{3})+)',
        r'(\d{4,})',
    ]
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            val = int(m.group(1).replace(',', ''))
            if 10 <= val <= 10_000_000:
                return val
    return None


def parse_pdf_tables(pdf_path: str, source_name: str) -> List[Transaction]:
    """Try table-based extraction first (works well for structured credit card PDFs)."""
    transactions = []
    default_year = datetime.now().year

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if not row:
                        continue
                    cells = [str(c).strip() if c else "" for c in row]
                    row_text = " ".join(cells)

                    # Find a date cell
                    date_str = None
                    for cell in cells:
                        d = parse_date(cell, default_year)
                        if d:
                            date_str = d
                            break

                    if not date_str:
                        continue

                    # Find an amount cell (prefer cells with comma-separated numbers)
                    amount = None
                    for cell in cells:
                        a = extract_amount(cell)
                        if a:
                            amount = a
                            break

                    if not amount:
                        continue

                    # Description: remaining cells excluding date and amount
                    desc_parts = []
                    for cell in cells:
                        if cell and cell != date_str and not re.match(r'^[\d,]+$', cell.replace('円', '').strip()):
                            desc_parts.append(cell)
                    description = " ".join(desc_parts).strip() or "不明"

                    transactions.append(Transaction(
                        date=date_str,
                        description=description[:200],
                        amount=amount,
                        category=guess_category(description),
                        source=source_name,
                    ))

    return transactions


def parse_pdf_text(pdf_path: str, source_name: str) -> List[Transaction]:
    """Fallback: extract transactions from raw text."""
    transactions = []
    default_year = datetime.now().year

    date_patterns = [
        r'\d{4}[/\-年]\d{1,2}[/\-月]\d{1,2}日?',
        r'\d{1,2}[/月]\d{1,2}日?',
    ]
    date_re = re.compile('|'.join(date_patterns))
    amount_re = re.compile(r'(\d{1,3}(?:,\d{3})+|\d{4,})\s*円?')

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if not line:
                    continue

                date_m = date_re.search(line)
                if not date_m:
                    continue

                date_str = parse_date(date_m.group(0), default_year)
                if not date_str:
                    continue

                amounts = [
                    int(m.group(1).replace(',', ''))
                    for m in amount_re.finditer(line)
                    if 10 <= int(m.group(1).replace(',', '')) <= 10_000_000
                ]
                if not amounts:
                    continue

                amount = amounts[0]

                desc = line[:date_m.start()].strip()
                if not desc:
                    desc = line[date_m.end():].strip()
                    desc = amount_re.sub('', desc).strip()
                desc = desc[:200] or "不明"

                transactions.append(Transaction(
                    date=date_str,
                    description=desc,
                    amount=amount,
                    category=guess_category(desc),
                    source=source_name,
                ))

    return transactions


def parse_pdf(pdf_path: str, source_name: str) -> List[Transaction]:
    transactions = parse_pdf_tables(pdf_path, source_name)
    if not transactions:
        transactions = parse_pdf_text(pdf_path, source_name)
    # Deduplicate by (date, description, amount)
    seen = set()
    unique = []
    for t in transactions:
        key = (t.date, t.description, t.amount)
        if key not in seen:
            seen.add(key)
            unique.append(t)
    return unique
