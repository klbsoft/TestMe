#!/usr/bin/env bash
# clear-all.sh — wipes the four collections used by the testme app.
set -euo pipefail

MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/testme}"

npx mongosh "$MONGO_URI" --eval '
  const cols = ["sessions", "files", "raw_assigments", "attempts"];
  for (const name of cols) {
    const res = db.getCollection(name).deleteMany({});
    print(name.padEnd(16), "→ deleted", res.deletedCount);
  }
'
