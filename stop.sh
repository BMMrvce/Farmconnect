#!/bin/bash

# Farm Management System - Stop Script
# This script stops all running services

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  🌾 Stopping Farm Management System"
echo "=========================================="
echo ""

# Check if PID files exist
if [ ! -f ".backend.pid" ] && [ ! -f ".frontend.pid" ]; then
    echo -e "${YELLOW}⚠${NC} No running services found (PID files missing)"
    echo ""
    echo "Checking for processes on ports..."
    
    # Try to find and kill processes on the ports
    BACKEND_PID=$(lsof -ti:8001 2>/dev/null)
    FRONTEND_PID=$(lsof -ti:3000 2>/dev/null)
    
    if [ -n "$BACKEND_PID" ]; then
        echo "Found backend process on port 8001 (PID: $BACKEND_PID)"
        kill -9 $BACKEND_PID 2>/dev/null && echo -e "${GREEN}✓${NC} Backend stopped"
    fi
    
    if [ -n "$FRONTEND_PID" ]; then
        echo "Found frontend process on port 3000 (PID: $FRONTEND_PID)"
        kill -9 $FRONTEND_PID 2>/dev/null && echo -e "${GREEN}✓${NC} Frontend stopped"
    fi
    
    if [ -z "$BACKEND_PID" ] && [ -z "$FRONTEND_PID" ]; then
        echo "No processes found on ports 8001 or 3000"
    fi
    
    exit 0
fi

# Read PIDs from files
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo -e "${GREEN}✓${NC} Backend stopped (PID: $BACKEND_PID)"
    else
        echo -e "${YELLOW}⚠${NC} Backend process not running (PID: $BACKEND_PID)"
    fi
    rm -f .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo -e "${GREEN}✓${NC} Frontend stopped (PID: $FRONTEND_PID)"
    else
        echo -e "${YELLOW}⚠${NC} Frontend process not running (PID: $FRONTEND_PID)"
    fi
    rm -f .frontend.pid
fi

# Clean up log files (optional)
if [ -f "backend.log" ] || [ -f "frontend.log" ]; then
    echo ""
    read -p "Delete log files? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f backend.log frontend.log
        echo -e "${GREEN}✓${NC} Log files deleted"
    fi
fi

echo ""
echo "=========================================="
echo "  ✅ All services stopped"
echo "=========================================="
echo ""
