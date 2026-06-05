# Personal Terminal 使い方ガイド

## 全体の流れ

```
STEP 1: ファイルをローカルに取得
STEP 2: Google の設定（15分）
STEP 3: Notion の設定（10分）
STEP 4: 環境変数を記入
STEP 5: アプリを起動
STEP 6: 仕事アカウントを追加（任意）
```

---

## 前提条件

以下がインストール済みであること:
- **Node.js 18以上** → https://nodejs.org/ja/
- **Git** → https://git-scm.com/
- **Google アカウント** (個人・仕事 各1つ)
- **Notion アカウント**

---

## STEP 1: ファイルをローカルに取得

ターミナル（Mac: Terminal、Windows: PowerShell）を開いて実行:

```bash
git clone -b claude/personal-terminal-google-notion-E9MwE \
  https://github.com/koh1028/zmk-config-roBa.git /tmp/zmk-tmp

cp -r /tmp/zmk-tmp/terminal ~/personal-terminal
cd ~/personal-terminal
```

---

## STEP 2: Google の設定

### 2-1. Google Cloud Console でプロジェクト作成

1. https://console.cloud.google.com/ を開く
2. 上部の **「プロジェクトを選択」** → **「新しいプロジェクト」** をクリック
3. プロジェクト名: `personal-terminal` → **「作成」**

### 2-2. 必要な API を有効化

1. 左メニュー **「APIとサービス」** → **「ライブラリ」**
2. 検索で **「Google Calendar API」** を検索 → クリック → **「有効にする」**
3. 同様に **「Gmail API」** を検索 → **「有効にする」**

### 2-3. OAuth 同意画面の設定

1. 左メニュー **「APIとサービス」** → **「OAuth 同意画面」**
2. **「外部」** を選択 → **「作成」**
3. 以下を入力:
   - アプリ名: `Personal Terminal`
   - ユーザーサポートメール: 自分のメールアドレス
   - デベロッパーの連絡先: 自分のメールアドレス
4. **「保存して次へ」** を3回クリック → **「ダッシュボードに戻る」**
5. **「テストユーザー」** タブ → **「+ ADD USERS」** → 自分のGmailアドレスを追加（個人・仕事 両方）

### 2-4. OAuth クライアント ID を作成

1. 左メニュー **「APIとサービス」** → **「認証情報」**
2. **「+ 認証情報を作成」** → **「OAuth クライアント ID」**
3. アプリケーションの種類: **「ウェブアプリケーション」**
4. 名前: `Personal Terminal`
5. **「承認済みのリダイレクト URI」** に以下を2つ追加:
   ```
   http://localhost:3000/api/auth/callback/google
   http://localhost:3000/api/auth/google-second/callback
   ```
6. **「作成」** をクリック
7. 表示される **「クライアント ID」** と **「クライアント シークレット」** をメモ帳にコピー

---

## STEP 3: Notion の設定

### 3-1. Notion インテグレーションを作成

1. https://www.notion.so/my-integrations を開く
2. **「+ 新しいインテグレーション」** をクリック
3. 名前: `Personal Terminal` → **「送信」**
4. 表示される **「内部インテグレーションシークレット」**（`secret_`で始まる）をコピー

### 3-2. Notion データベースを3つ作成

Notion を開いて、**新しいページ** を作成し、それぞれ以下の構成でデータベースを作ります。

#### ① TODO データベース

1. 新しいページを作成 → **「テーブル」** を選択
2. ページタイトル: `TODO`
3. 以下のプロパティを追加:

| プロパティ名 | 種類 | 設定 |
|---|---|---|
| Name | タイトル | (デフォルトで存在) |
| Done | チェックボックス | 追加 |
| Priority | セレクト | high / medium / low の3つを追加 |
| Due | 日付 | 追加 |

#### ② 日記データベース

1. 新しいページを作成 → **「テーブル」** を選択
2. ページタイトル: `日記`
3. 以下のプロパティを追加:

| プロパティ名 | 種類 |
|---|---|
| Title | タイトル（デフォルト名を変更） |
| Date | 日付 |

#### ③ メモデータベース

1. 新しいページを作成 → **「テーブル」** を選択
2. ページタイトル: `メモ`
3. 以下のプロパティを追加:

| プロパティ名 | 種類 |
|---|---|
| Title | タイトル（デフォルト名を変更） |
| Tags | マルチセレクト |

### 3-3. データベース ID を取得

各データベースのページを開き、URL を確認します:

```
https://www.notion.so/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...
                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                      この32文字がデータベースID
```

### 3-4. インテグレーションをデータベースと接続

各データベースページで:
1. 右上の **「…」** → **「接続」** → **「Personal Terminal」** を選択

---

## STEP 4: 環境変数を記入

```bash
cd ~/personal-terminal
cp .env.example .env.local
```

テキストエディタで `.env.local` を開いて記入:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=なんでもよい長いランダム文字列（例: abc123xyz456...）

GOOGLE_CLIENT_ID=STEP2-4でコピーしたクライアントID
GOOGLE_CLIENT_SECRET=STEP2-4でコピーしたクライアントシークレット

NOTION_API_KEY=STEP3-1でコピーしたsecret_...
NOTION_TODO_DB_ID=STEP3-3でコピーしたTODOのID
NOTION_DIARY_DB_ID=STEP3-3でコピーした日記のID
NOTION_MEMO_DB_ID=STEP3-3でコピーしたメモのID
```

> **NEXTAUTH_SECRET の生成方法:**
> ターミナルで `openssl rand -base64 32` を実行するとランダムな文字列が生成されます。

---

## STEP 5: アプリを起動

```bash
cd ~/personal-terminal
npm install        # 初回のみ（数分かかります）
npm run dev        # 起動
```

ブラウザで http://localhost:3000 を開く

→ **「> Google でログイン」** をクリック → **個人アカウント** でログイン

---

## STEP 6: 仕事アカウントを追加（任意）

1. ログイン後、画面上部の **「+ 仕事アカウント追加」** をクリック
2. **仕事用 Google アカウント** でログイン
3. ヘッダーに仕事アカウントのボタンが表示される

---

## 使い方

### アカウント切り替え

ヘッダーの **[個人名(personal)]** / **[仕事名(work)]** ボタンをクリック  
→ カレンダーと Gmail が切り替わる

### カレンダー（左端）
- 今後7日間の予定が自動表示
- クリックで Google カレンダーに遷移

### Gmail（左から2番目）
- 未読メールが自動表示
- 「開く →」で Gmail に遷移

### ブックマーク（左から3番目）
- **「+ ブックマークを追加」** → URL を入力 → Enter
- タイトル・カテゴリは省略可
- 上部の [all] [personal] [work] でフィルター
- × ボタンで削除

### Notion TODO（右上）
- テキスト入力 → Enter でタスク追加
- チェックボタンで完了（0.6秒後に非表示）
- 優先度・期限は Notion 側で設定

### Notion 日記（右中）
- 今日の日記がない場合: タイトル入力 → Enter → Notion で本文を書く
- 今日の日記がある場合: オレンジのボタンをクリック → Notion で続きを書く
- 過去のエントリはリストで表示

### Notion メモ（右下）
- タイトル入力 → Enter で新しいメモを Notion に作成
- タグはカンマ区切りで入力（例: `仕事, アイデア`）
- 検索ボックスでタイトル・タグを絞り込み

---

## よくある問題

| 症状 | 原因 | 対処 |
|---|---|---|
| ログインできない | リダイレクト URI が未設定 | STEP 2-4 のリダイレクト URI を確認 |
| カレンダーが表示されない | Calendar API が未有効 | STEP 2-2 を確認 |
| Notion が表示されない | DB ID またはインテグレーション未接続 | STEP 3-3, 3-4 を確認 |
| 「テストユーザーでないとログインできない」 | OAuth 同意画面の設定 | STEP 2-3 でメールアドレスを追加 |

---

## アプリの停止・再起動

```bash
# 停止: ターミナルで Ctrl + C

# 再起動:
cd ~/personal-terminal
npm run dev
```
