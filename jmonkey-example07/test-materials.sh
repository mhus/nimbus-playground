#!/bin/bash
# Test script to see material debug output

mvn compile -q 2>&1 | grep -v "WARNING"

echo "Starting app for 10 seconds to capture material output..."
timeout 10 bash run.sh 2>&1 | grep -E "(Material|DiffuseMap|AlphaMap|CrossRoad|Procedural)" | head -50
