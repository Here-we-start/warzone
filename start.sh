#!/bin/bash
# Simple start script for Render deployment

echo "Current directory: $(pwd)"
echo "Listing directory structure:"
find . -type d -not -path "*/node_modules/*" -not -path "*/\.*" | sort

echo "Current working directory before npm commands:"
pwd

echo "Checking package.json exists:"
ls -la project/package.json

# Start the application
echo "Starting application from project directory..."
npm start --prefix project