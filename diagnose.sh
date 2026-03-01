#!/bin/bash

# 🔍 Diagnostic script to test if Server is running and all apps can connect

echo "======================================"
echo "🔍 REMIND System Diagnostic"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local url=$1
    local label=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅${NC} $label: $response"
        return 0
    else
        echo -e "${RED}❌${NC} $label: $response"
        return 1
    fi
}

# Function to test if port is open
test_port() {
    local port=$1
    local name=$2
    
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $name running on port $port"
        return 0
    else
        echo -e "${RED}❌${NC} $name NOT running on port $port"
        return 1
    fi
}

echo "🔗 Checking Server Connectivity..."
echo ""

# Test Server
echo -e "${YELLOW}[1/5]${NC} Server (Port 3001)..."
if test_port 3001 "Server"; then
    echo "     Testing API endpoints:"
    test_endpoint "http://localhost:3001/api/regions" "       - GET /api/regions"
    test_endpoint "http://localhost:3001/api/buttons" "       - GET /api/buttons"
    test_endpoint "http://localhost:3001/api/widgets" "       - GET /api/widgets"
    test_endpoint "http://localhost:3001/api/auth/login" "    - POST /api/auth/login"
else
    echo -e "${RED}⚠️  Server is NOT running!${NC}"
    echo "    Start it with: cd index-oblav-v6/server && npm start"
fi
echo ""

# Test Main App
echo -e "${YELLOW}[2/5]${NC} Main App (Port 5173)..."
test_port 5173 "Main App"
echo ""

# Test Config Manager  
echo -e "${YELLOW}[3/5]${NC} Config Manager (Port 7000)..."
test_port 7000 "Config Manager"
echo ""

# Test Org Function
echo -e "${YELLOW}[4/5]${NC} Org Function (Port 4000)..."
test_port 4000 "Org Function"
echo ""

# Test Widget Constructor
echo -e "${YELLOW}[5/5]${NC} Widget Constructor (Port 8000)..."
test_port 8000 "Widget Constructor"
echo ""

echo "======================================"
echo "📋 Summary:"
echo "======================================"
echo ""
echo "If Server (3001) shows ❌:"
echo "  1. Go to: cd /workspaces/remind/index-oblav-v6/server"
echo "  2. Run: npm install"
echo "  3. Run: npm start"
echo "  4. Wait for: ✅ Server OK on port 3001"
echo ""
echo "If other apps show ❌:"
echo "  1. Go to that app directory"
echo "  2. Run: npm install"
echo "  3. Run: npm run dev"
echo ""
echo "Make sure ALL show ✅ for everything to work!"
echo ""
