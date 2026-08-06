#!/bin/bash
ls -la backend/models/
for f in backend/models/*.go; do
  echo "=== $f ==="
  cat "$f"
  echo
done