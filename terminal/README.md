# Personal Terminal

Google・Notion連携パーソナルダッシュボード

## 機能

| 機能 | 説明 |
|------|------|
| **Googleカレンダー** | 今後7日間の予定を表示 |
| **Gmail** | 未読メール一覧 |
| **ブックマーク** | カテゴリ・アカウント別URL管理 |
| **Notion TODO** | チェックボックスでタスク管理 |
| **Notion 日記** | 今日の日記作成・過去ログ |
| **Notion メモ** | タグ付きメモ・検索 |

Googleアカウントは **2アカウント切り替え** 対応（個人・仕事）。

---

## セットアップ

### 1. 環境変数の設定

```bash
cp .env.example .env.local
```

### 2. Google Cloud Console の設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成
2. **APIとサービス > ライブラリ** で以下を有効化:
   - Google Calendar API
   - Gmail API
3. **APIとサービス > 認証情報 > OAuthクライアントID** を作成
   - アプリケーションの種類: ウェブアプリケーション
   - 承認済みリダイレクトURI:
     - `http://localhost:3000/api/auth/callback/google`
     - `http://localhost:3000/api/auth/google-second/callback`
4. クライアントID・シークレットを `.env.local` に設定

### 3. Notion の設定

1. [Notion インテグレーション](https://www.notion.so/my-integrations) で新規作成
2. APIキーを `.env.local` の `NOTION_API_KEY` に設定
3. 以下のデータベースを作成してインテグレーションと共有:

#### TODO データベース
| プロパティ名 | タイプ | 選択肢 |
|------------|--------|--------|
| Name | タイトル | - |
| Done | チェックボックス | - |
| Priority | セレクト | high / medium / low |
| Due | 日付 | - |

#### 日記データベース
| プロパティ名 | タイプ |
|------------|--------|
| Title | タイトル |
| Date | 日付 |

#### メモデータベース
| プロパティ名 | タイプ |
|------------|--------|
| Title | タイトル |
| Tags | マルチセレクト |

4. 各データベースURLの末尾ID(32文字)を `.env.local` に設定

### 4. 起動

```bash
cd terminal
npm install
npm run dev
```

`http://localhost:3000` を開いてGoogleアカウントでログイン。

---

## 2アカウント対応

1. ログイン後、ヘッダーの **「+ 仕事アカウント追加」** をクリック
2. 仕事用Googleアカウントで認証
3. ヘッダーで **[個人] / [仕事]** を切り替えると、カレンダー・Gmailが該当アカウントに切り替わる

---

## ディレクトリ構成

```
terminal/
├── src/
│   ├── app/
│   │   ├── page.tsx          # メインダッシュボード
│   │   ├── api/
│   │   │   ├── auth/         # NextAuth + 2アカウント認証
│   │   │   ├── google/       # Calendar・Gmail API
│   │   │   ├── notion/       # TODO・日記・メモ API
│   │   │   └── bookmarks/    # ブックマーク管理
│   ├── components/           # 各ウィジェット
│   └── lib/                  # API ヘルパー
└── data/                     # ブックマーク保存 (git管理外)
```
