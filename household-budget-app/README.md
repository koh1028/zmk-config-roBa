# 家計簿アプリ

クレジットカードのPDFから自動で家計簿を作成するWebアプリです。

## 機能

- **PDFファイル取込** — 複数のクレジットカードPDFをアップロードし、自動解析して統一フォーマットで管理
- **固定費登録** — 家賃・ローン・光熱費などの毎月の固定支払いを手動登録
- **返済シミュレーター** — ローン・借金の残債から返済スケジュールを計算。ボーナス返済や追加返済もシミュレーション可能
- **グラフ分析** — 月別・カテゴリ別の支出をグラフで可視化。前月比や支出上位の店舗も確認可能
- **カテゴリ自動判定** — 店舗名・内容からカテゴリを自動判定（食費・交通費・娯楽・医療等）

## 対応クレジットカード

表形式または標準的なテキスト形式のPDFに対応：
- 楽天カード、三井住友カード、JCBカード、イオンカード、セゾンカード 等

## 起動方法

**必要環境:** Python 3.10+, Node.js 18+

```bash
cd household-budget-app
bash start.sh
```

ブラウザで `http://localhost:5173` を開いてください。

## 個別起動

```bash
# バックエンド
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# フロントエンド（別ターミナル）
cd frontend
npm install
npm run dev
```

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 18 + TypeScript + Vite |
| スタイリング | Tailwind CSS |
| チャート | Recharts |
| バックエンド | Python FastAPI |
| PDF解析 | pdfplumber |
| データベース | SQLite（ローカル保存） |
