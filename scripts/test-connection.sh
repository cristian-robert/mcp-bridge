#!/bin/bash

echo "🔧 Testing MCP Bridge Connection..."
echo ""

# Check if built
if [ ! -f "dist/index.js" ]; then
    echo "❌ Bridge not built. Run: npm run build"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env and add your TAVILY_API_KEY"
    exit 1
fi

# Check for Tavily API key
if ! grep -q "TAVILY_API_KEY=tvly-" .env; then
    echo "⚠️  TAVILY_API_KEY not configured in .env"
    echo "📝 Please add your API key to .env"
    exit 1
fi

echo "✅ Build found"
echo "✅ Configuration found"
echo ""
echo "🚀 Starting bridge server for 3 seconds..."
echo ""

# Start server and capture output
timeout 3 node dist/index.js 2>&1 &
PID=$!

sleep 3

if ps -p $PID > /dev/null 2>&1; then
    echo ""
    echo "✅ Bridge server is running!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Add to ~/.claude.json:"
    echo '      {'
    echo '        "mcpServers": {'
    echo '          "mcp-bridge": {'
    echo '            "command": "node",'
    echo "            \"args\": [\"$(pwd)/dist/index.js\"]"
    echo '          }'
    echo '        }'
    echo '      }'
    echo ""
    echo "   2. Restart Claude Code"
    echo ""

    kill $PID 2>/dev/null
else
    echo "❌ Bridge server failed to start"
    echo "Check logs above for errors"
    exit 1
fi
