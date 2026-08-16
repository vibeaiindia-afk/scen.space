#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Scen local preview at http://localhost:8765"
python3 -m http.server 8765
