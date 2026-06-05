#!/bin/bash
# personal-terminal を新しいリポジトリとしてセットアップするスクリプト
# このスクリプトをローカルで実行してください

set -e

REPO_URL="https://github.com/koh1028/personal-terminal.git"
WORK_DIR="$HOME/personal-terminal"

echo "=== personal-terminal セットアップ ==="
echo ""

# 1. zmk-config-roBa から terminal ディレクトリを取得
echo "[1/4] zmk-config-roBa リポジトリをクローン..."
git clone https://github.com/koh1028/zmk-config-roBa.git /tmp/zmk-clone-tmp
cd /tmp/zmk-clone-tmp
git checkout claude/personal-terminal-google-notion-E9MwE

# 2. terminal ディレクトリをコピー
echo "[2/4] terminal ディレクトリをコピー..."
cp -r /tmp/zmk-clone-tmp/terminal "$WORK_DIR"
rm -rf /tmp/zmk-clone-tmp

# 3. 新しい git リポジトリとして初期化
echo "[3/4] 新リポジトリとして初期化..."
cd "$WORK_DIR"
git init
git branch -m main
git add .
git commit -m "feat: 初期実装 - パーソナルターミナル"

# 4. プッシュ
echo "[4/4] GitHub へプッシュ..."
git remote add origin "$REPO_URL"
git push -u origin main

echo ""
echo "=== 完了! ==="
echo "リポジトリ: $REPO_URL"
echo "ディレクトリ: $WORK_DIR"
echo ""
echo "次のステップ:"
echo "  cd $WORK_DIR"
echo "  cp .env.example .env.local"
echo "  # .env.local を編集して API キーを設定"
echo "  npm install"
echo "  npm run dev"
