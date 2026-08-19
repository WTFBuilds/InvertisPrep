#!/bin/bash

# start-all.sh - Boots Redis (if not running), then all InvertisPrep services.
# Usage: ./start-all.sh
# Stop everything with Ctrl+C.

set -e
cd "$(dirname "$0")"

echo "🚀 Starting InvertisPrep services..."

# ── Redis ────────────────────────────────────────────────────────────────────
if command -v redis-cli >/dev/null 2>&1 && redis-cli ping >/dev/null 2>&1; then
  echo "✅ Redis already running"
elif command -v redis-server >/dev/null 2>&1; then
  echo "▶  Starting Redis..."
  redis-server --port 6379 --daemonize yes --save ''
  sleep 1
  redis-cli ping >/dev/null || { echo "❌ Redis failed to start"; exit 1; }
  echo "✅ Redis started on :6379"
else
  echo "⚠️  Redis not found — install it (brew install redis) and start it manually."
  echo "   Auth/PDF caching will fail without it. Continuing anyway..."
fi

# ── Services ────────────────────────────────────────────────────────────────
PIDS=()

start_service() {
  local name="$1" dir="$2" port="$3"
  if lsof -nP -i :"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "⏭  $name already running on :$port"
    return
  fi
  (cd "$dir" && npm run dev) &
  PIDS+=($!)
  echo "▶  $name starting on :$port (pid ${PIDS[-1]})"
}

start_service "Main server"  "server"       5000
start_service "PDF service"  "pdf-service"  5002
start_service "Client"       "client"       3000

cleanup() {
  echo ""
  echo "🛑 Stopping services..."
  kill "${PIDS[@]}" 2>/dev/null
  wait 2>/dev/null
  echo "✅ Stopped. (Redis daemon left running — stop with: redis-cli shutdown)"
}
trap cleanup SIGINT SIGTERM

echo ""
echo "🟢 All services launching:"
echo "   Client       → http://localhost:3000"
echo "   Main server  → http://localhost:5000/health"
echo "   PDF service  → http://localhost:5002/api/health"
echo ""
wait
