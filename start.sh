#!/bin/bash
# Simple start script for Render deployment

# Debug: Print current directory
echo "Current directory: $(pwd)"
echo "Listing files in current directory:"
ls -la

# Start the application
echo "Starting application..."
npm start