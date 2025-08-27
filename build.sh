#!/bin/bash
set -e

# Install dependencies
apt-get update && apt-get install -y build-essential curl

# Clone llama.cpp if not already included
if [ ! -d "llama.cpp" ]; then
  git clone https://github.com/ggerganov/llama.cpp.git
fi

cd llama.cpp

# Build llama-cli
make llama-cli

# Copy binary to repo root
cp ./llama-cli ../llama-cli
