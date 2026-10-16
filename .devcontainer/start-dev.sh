#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
port="${YSP_PORT:-3000}"
url="http://127.0.0.1:${port}/login"
log_file="/tmp/ysp-portal-dev-${port}.log"

if curl --fail --silent --output /dev/null --max-time 2 "$url"; then
  echo "YSP Portal is already running on port ${port}."
  exit 0
fi

if [ ! -d node_modules ]; then
  npm ci
fi

nohup npm run dev -- --port "$port" > "$log_file" 2>&1 < /dev/null &

for attempt in {1..30}; do
  if curl --fail --silent --output /dev/null --max-time 2 "$url"; then
    echo "YSP Portal is ready on port ${port}."
    exit 0
  fi
  sleep 1
done

echo "YSP Portal did not start. Recent log output:" >&2
tail -n 40 "$log_file" >&2
exit 1
