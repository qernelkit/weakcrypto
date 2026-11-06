#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <search-regex>"
  echo
  echo "Examples:"
  echo "  $0 'cipher\\.auth_data'"
  echo "  $0 'cipher\\.iv|cipher\\.random_iv|cipher\\.auth_data'"
  echo
  echo "Output:"
  echo "  file:line:column:matched_text"
}

if [ "$#" -ne 1 ]; then
  usage
  exit 1
fi

pattern="$1"

grep_pattern="$pattern"
awk_pattern="${pattern//\\/\\\\}"

grep -R -En "$grep_pattern" . |
awk -F: -v pattern="$awk_pattern" '
{
  file = $1
  lineno = $2
  text = substr($0, length(file ":" lineno ":") + 1)

  sub(/[[:space:]]*#.*/, "", text)
  sub(/[[:space:]]*\/\/.*/, "", text)

  offset = 0

  while (match(text, pattern)) {
    col = offset + RSTART
    match_text = substr(text, RSTART, RLENGTH)
    print file ":" lineno ":" col ":" match_text

    offset += RSTART + RLENGTH - 1
    text = substr(text, RSTART + RLENGTH)
  }
}
'