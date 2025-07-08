#!/bin/bash
# Simple build script for Render deployment

# Change to project directory
cd project

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build
