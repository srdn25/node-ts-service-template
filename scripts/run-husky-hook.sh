#!/bin/bash

# Wrapper script for Husky hooks to ensure they run in WSL environment
# This fixes issues when Git is running from Windows but project is in WSL

set -e

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Change to project root
cd "$PROJECT_ROOT"

# Set locale
export LC_ALL=C.UTF-8
export LANG=C.UTF-8

# Execute the command passed as arguments
exec "$@" 