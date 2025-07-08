#!/bin/bash
# Simple build script for Render deployment

echo "Current directory: $(pwd)"
echo "Listing files:"
ls -la

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

echo "Build completed successfully!"