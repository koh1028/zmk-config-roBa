#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Install backend deps
cd "$BACKEND_DIR"
if ! python3 -m pip show fastapi &>/dev/null; then
  echo "Installing backend dependencies..."
  pip3 install -r requirements.txt
fi

# Install frontend deps
cd "$FRONTEND_DIR"
if [ ! -d node_modules ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

# Start backend
cd "$BACKEND_DIR"
echo "Starting backend on http://localhost:8000 ..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend
cd "$FRONTEND_DIR"
echo "Starting frontend on http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================="
echo "  家計簿アプリ起動完了"
echo "  http://localhost:5173 を開いてください"
echo "========================================="
echo "  Ctrl+C で終了します"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
