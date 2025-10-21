#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."

cd "${PROJECT_ROOT}"

echo "🌱 Seeding LuxeStay experiences..."
pnpm tsx scripts/seed-experiences.ts
