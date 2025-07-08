#!/bin/bash
# Simple build script for Render deployment

# Debug: Print current directory
echo "Current directory: $(pwd)"
echo "Listing files in current directory:"
ls -la

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build
