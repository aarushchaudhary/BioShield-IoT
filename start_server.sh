#!/bin/bash
# BioShield IoT API Server Startup Script
# This script helps start the FastAPI server with proper network configuration

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   BioShield IoT API Server Startup    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found!${NC}"
    echo "Please create a .env file with the required variables."
    exit 1
fi

# Activate virtual environment if it exists
if [ -d venv ]; then
    echo -e "${GREEN}✓ Activating Python virtual environment...${NC}"
    source venv/bin/activate
fi

# Get IP address
IP_ADDRESS=$(hostname -I | awk '{print $1}')
if [ -z "$IP_ADDRESS" ]; then
    # Fallback for systems where hostname -I doesn't work
    IP_ADDRESS=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v 127.0.0.1 | head -n1)
fi

echo -e "${GREEN}✓ Your machine IP address: ${BLUE}$IP_ADDRESS${NC}"
echo ""
echo -e "${YELLOW}📱 For your phone:${NC}"
echo -e "   ${BLUE}http://$IP_ADDRESS:8000/${NC}"
echo ""

# Start the server
echo -e "${YELLOW}🚀 Starting FastAPI server...${NC}"
echo "   Server will listen on http://0.0.0.0:8000"
echo ""

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
