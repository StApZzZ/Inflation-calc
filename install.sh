#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-$HOME/inflation-income-site}"
NODE_MAJOR="22"

echo "==> Project dir: $PROJECT_DIR"
echo "==> Installing Node.js ${NODE_MAJOR}.x"

if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "ERROR: Directory not found: $PROJECT_DIR"
  exit 1
fi

sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

sudo mkdir -p /etc/apt/keyrings

if [[ ! -f /etc/apt/keyrings/nodesource.gpg ]]; then
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
fi

echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
  | sudo tee /etc/apt/sources.list.d/nodesource.list >/dev/null

sudo apt-get update
sudo apt-get install -y nodejs

echo "==> Node version:"
node -v
echo "==> NPM version:"
npm -v

cd "$PROJECT_DIR"

echo "==> Cleaning old artifacts"
rm -rf node_modules .next package-lock.json

echo "==> Installing dependencies"
npm install

echo "==> Building project"
npm run build

echo
echo "Done."
echo "To run locally:"
echo "  cd $PROJECT_DIR && npm run dev"
echo
echo "To run production:"
echo "  cd $PROJECT_DIR && npm start"
