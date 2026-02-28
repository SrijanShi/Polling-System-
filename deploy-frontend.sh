#!/bin/bash
set -e
cd "$(dirname "$0")/client"
echo "Working directory: $(pwd)"
exec flyctl deploy
