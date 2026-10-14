#!/usr/bin/env bash
# Trello REST API helper. Credentials are read from the repo's .env on every call
# (TRELLO_API_KEY, TRELLO_TOKEN) and sent in the Authorization header, never in URLs,
# never echoed. Nothing is exported to the global environment.
#
# Usage: bash .claude/skills/trello/trello.sh <GET|POST|PUT|DELETE> <path> [key=value ...]
#   GET params go in the query string; other methods send them as a form-encoded body.
# Example: bash .claude/skills/trello/trello.sh GET /boards/<id>/lists fields=name
set -euo pipefail

ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
ENV_FILE="$ROOT/.env"
[ -f "$ENV_FILE" ] || { echo "trello.sh: $ENV_FILE not found" >&2; exit 2; }

read_var() { grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\r"'"'" || true; }
KEY="$(read_var TRELLO_API_KEY)"
TOKEN="$(read_var TRELLO_TOKEN)"
[ -n "$KEY" ] && [ -n "$TOKEN" ] || { echo "trello.sh: TRELLO_API_KEY / TRELLO_TOKEN missing in .env" >&2; exit 2; }

[ $# -ge 2 ] || { echo "usage: trello.sh <METHOD> <path> [key=value ...]" >&2; exit 2; }
METHOD="$(echo "$1" | tr '[:lower:]' '[:upper:]')"
API_PATH="$2"
shift 2

# Boards this helper must never touch (other projects' and companies' boards).
DENIED_BOARDS="6abd38af92e4d48d570676e0 6a3ce14af751db83bdf94e9d"   # Impera Energy, RZ Solar - Tech
for denied in $DENIED_BOARDS; do
  case "$API_PATH $*" in *"$denied"*) echo "trello.sh: refusing to access denied board $denied" >&2; exit 3;; esac
done

TMPDIR_ARGS="$(mktemp -d)"
BODY="$TMPDIR_ARGS/body"
trap 'rm -rf "$TMPDIR_ARGS"' EXIT

args=()
i=0
for kv in "$@"; do
  i=$((i + 1))
  printf '%s' "${kv#*=}" > "$TMPDIR_ARGS/arg$i"
  argfile="$TMPDIR_ARGS/arg$i"
  command -v cygpath >/dev/null 2>&1 && argfile="$(cygpath -m "$argfile")"
  args+=(--data-urlencode "${kv%%=*}@$argfile")
done

AUTH="Authorization: OAuth oauth_consumer_key=\"$KEY\", oauth_token=\"$TOKEN\""
URL="https://api.trello.com/1${API_PATH}"

# Portable replacement for --fail-with-body (curl >= 7.76): print the body, fail on HTTP >= 400.
if [ "$METHOD" = "GET" ]; then
  STATUS="$(curl -sS -o "$BODY" -w '%{http_code}' -G -H "$AUTH" "${args[@]}" "$URL")"
else
  STATUS="$(curl -sS -o "$BODY" -w '%{http_code}' -X "$METHOD" -H "$AUTH" "${args[@]}" "$URL")"
fi
cat "$BODY"
echo
if [ "$STATUS" -ge 400 ]; then
  echo "trello.sh: HTTP $STATUS" >&2
  exit 22
fi
