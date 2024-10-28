#!/bin/bash
# run.sh

# Kill background processes on exit
trap "kill 0" EXIT

# Start Node.js server
echo "✨ Starting Node.js server..."
bun server.ts &

# Wait for server to start
sleep 2

# Start Python agent
echo "🐍 Starting Python agent..."
python run.py &

# Wait for both processes
echo "🚀 All systems running! Press Ctrl+C to stop."
wait