#!/usr/bin/env bash
set -euo pipefail

# Publish EliusWiki to GitHub Pages.
# Usage: ./publish.sh <github-username> [repository-name]
#
# Creates an empty repository on github.com first, then run this script.
# Example: ./publish.sh ielius eliuswiki

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <github-username> [repository-name]" >&2
  exit 1
fi

user="$1"
repo="${2:-eliuswiki}"
url="https://github.com/${user}/${repo}.git"

cd "$(dirname "$0")"

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$url"
else
  git remote add origin "$url"
fi

git push -u origin main

echo ""
echo "Pushed to $url"
echo "Next: GitHub repo Settings -> Pages -> Source: GitHub Actions"
echo "Then: Custom domain elius.wiki, and DNS A records to GitHub Pages."
