#!/usr/bin/env bash
set -e

# Clone llama.cpp if not already there
if [ ! -d "llama.cpp" ]; then
  git clone https://github.com/ggerganov/llama.cpp
fi

cd llama.cpp

# Prepare build directory
mkdir -p build
cd build

# Configure and build in Release mode, but no subfolder
cmake -DCMAKE_BUILD_TYPE=Release ..
cmake --build . -j$(nproc)
