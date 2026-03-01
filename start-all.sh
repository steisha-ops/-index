#!/bin/bash



echo "======================================"
echo "🚀 Starting Remind System"
echo "======================================"
echo ""
echo "⚠️  This will open 5 new terminals..."
echo ""


GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' 


run_in_terminal() {
    local title=$1
    local command=$2
    local port=$3
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e "tell application \"Terminal\" to do script \"cd /workspaces/remind && $command\""
    else
        
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal --title="$title" -- bash -c "cd /workspaces/remind && $command; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -title "$title" -e "cd /workspaces/remind && $command" &
        else
            
            echo -e "${BLUE}[Manual]${NC} Start in terminal: $command"
            return 1
        fi
    fi
}

echo -e "${GREEN}1. Starting SERVER (port 3001)${NC}"
run_in_terminal "Server" "cd index-oblav-v6/server && npm start" "3001"
sleep 2

echo -e "${GREEN}2. Starting Config Manager (port 7000)${NC}"
run_in_terminal "Config Manager" "cd index-oblav-config-manager && npm run dev" "7000"
sleep 1

echo -e "${GREEN}3. Starting Main App (port 5173)${NC}"
run_in_terminal "Main App" "cd index-oblav-v6 && npm run dev" "5173"
sleep 1

echo -e "${GREEN}4. Starting Org Function (port 4000)${NC}"
run_in_terminal "Org Function" "cd index-oblav-org-function && npm run dev" "4000"
sleep 1

echo -e "${GREEN}5. Starting Widget Constructor (port 8000)${NC}"
run_in_terminal "Widget Constructor" "cd index-oblav-widget-constructor && npm run dev" "8000"

echo ""
echo "======================================"
echo "✅ All apps starting..."
echo "======================================"
echo ""
echo "URLs:"
echo -e "${GREEN}Server:${NC}              http://localhost:3001/api/regions"
echo -e "${GREEN}Main App:${NC}            http://localhost:5173"
echo -e "${GREEN}Config Manager:${NC}      http://localhost:7000"
echo -e "${GREEN}Org Function:${NC}        http://localhost:4000"
echo -e "${GREEN}Widget Constructor:${NC}  http://localhost:8000"
echo ""
echo "⏳ Wait 30 seconds for all services to start..."
echo ""
