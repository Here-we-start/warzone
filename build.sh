#!/bin/bash
# Simple build script for Render deployment

echo "Current directory: $(pwd)"
echo "Listing directory structure:"
find . -type d -not -path "*/node_modules/*" -not -path "*/\.*" | sort

echo "Moving to project directory..."
cd project

echo "Checking package.json exists:"
ls -la package.json

# Install dependencies
echo "Installing dependencies from project directory..."
npm install

# Build the application
echo "Building application from project directory..."
npm run build

echo "Build completed successfully from project directory!"