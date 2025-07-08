#!/bin/bash
# Simple build script for Render deployment

echo "Current directory: $(pwd)"
echo "Listing directory structure:"
find . -type d -not -path "*/node_modules/*" -not -path "*/\.*" | sort

echo "Current working directory before npm commands:"
pwd

echo "Checking package.json exists:"
ls -la project/package.json

# Install dependencies
echo "Installing dependencies from project directory..."
npm install --prefix project

# Build the application
echo "Building application from project directory..."
npm run build --prefix project

echo "Build completed successfully from project directory!"