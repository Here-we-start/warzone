#!/bin/bash
# Simple start script for Render deployment

# Debug: Print current directory
echo "Current directory: $(pwd)"
echo "Listing files in current directory:"
ls -la

# Change to project directory and verify
cd project
echo "Changed to project directory: $(pwd)"
echo "Listing files in project directory:"
ls -la

# Start the application
echo "Starting application..."
npm start