#!/usr/bin/env bash
# Assert spend_transactions columns after `supabase db reset` (local CI).
set -euo pipefail

DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

REQUIRED=(
  canonical_supplier
  supplier
  category
  amount
  date
  pub
  description
  import_batch_id
)

echo "Checking spend_transactions on $DB_URL"

mapfile -t ACTUAL < <(
  psql "$DB_URL" -tAc \
    "select column_name from information_schema.columns
     where table_schema = 'public' and table_name = 'spend_transactions'
     order by 1;"
)

echo "Columns found:"
printf '  - %s\n' "${ACTUAL[@]}"

for col in "${REQUIRED[@]}"; do
  found=0
  for a in "${ACTUAL[@]}"; do
    if [[ "$(echo "$a" | tr -d '[:space:]')" == "$col" ]]; then
      found=1
      break
    fi
  done
  if [[ "$found" -ne 1 ]]; then
    echo "MISSING required column: $col"
    exit 1
  fi
done

echo "OK — all required columns present."
