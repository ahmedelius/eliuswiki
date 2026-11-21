#!/usr/bin/env bash
set -euo pipefail

# Publish EliusWiki to GitHub Pages.
# Usage: ./publish.sh <github-username> [repository-name] [https|ssh]
#
# Create an empty repository on github.com first, then run this script.
# Example: ./publish.sh ielius eliuswiki ssh

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <github-username> [repository-name] [https|ssh]" >&2
  exit 1
fi

user="$1"
repo="${2:-eliuswiki}"
proto="${3:-https}"

if [ "$proto" = "ssh" ]; then
  url="git@github.com:${user}/${repo}.git"
else
  url="https://github.com/${user}/${repo}.git"
fi

cd "$(dirname "$0")"

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$url"
else
  git remote add origin "$url"
fi

git push -u origin main

echo ""
echo "Pushed to $url"
echo "GitHub Pages deploys main / root automatically."
echo "Staging: https://ahmedelius.github.io/eliuswiki/"
echo "Remaining: point elius.wiki DNS at GitHub, then enforce HTTPS."
