#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🧹 Clearing database & seeding curated LuxeStay dataset..."
cd "$ROOT_DIR"
pnpm tsx prisma/seed-curated.ts
