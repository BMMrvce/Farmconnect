#!/bin/bash

# Farm Management System - Quick Start Script
# This script helps you quickly start both backend and frontend services

set -e  # Exit on error

echo "=========================================="
echo "  🌾 Farm Management System"
echo "  Quick Start Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}Error: This script must be run from the project root directory${NC}"
    exit 1
fi

# Check Python version
echo "Checking Python version..."
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}✓${NC} Python $PYTHON_VERSION"

# Check Node version
echo "Checking Node version..."
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓${NC} Node $NODE_VERSION"

# Check Yarn
echo "Checking Yarn..."
if ! command -v yarn &> /dev/null; then
    echo -e "${RED}✗ Yarn not found. Please install yarn: npm install -g yarn${NC}"
    exit 1
fi
YARN_VERSION=$(yarn --version)
echo -e "${GREEN}✓${NC} Yarn $YARN_VERSION"
echo ""

# Backend setup
echo "Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✓${NC} Virtual environment created"
fi

source venv/bin/activate

# Check if dependencies are installed
if [ ! -f "venv/lib/python*/site-packages/fastapi/__init__.py" ]; then
    echo "Installing backend dependencies..."
    pip install -r requirements.txt > /dev/null 2>&1
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "${GREEN}✓${NC} Backend dependencies already installed"
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠${NC} Backend .env file not found!"
    echo "Please create backend/.env with your Supabase credentials"
    echo "See README.md for configuration details"
    exit 1
fi
echo -e "${GREEN}✓${NC} Backend .env file found"

cd ..

# Frontend setup
echo ""
echo "Setting up frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    yarn install > /dev/null 2>&1
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "${GREEN}✓${NC} Frontend dependencies already installed"
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠${NC} Frontend .env file not found!"
    echo "Creating default .env file..."
    echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env
    echo -e "${GREEN}✓${NC} Created frontend .env file"
fi
echo -e "${GREEN}✓${NC} Frontend .env file found"

cd ..

echo ""
echo "=========================================="
echo "  Starting Services"
echo "=========================================="
echo ""

# Start backend
echo "Starting backend on http://localhost:8001 ..."
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to initialize..."
sleep 3

# Check if backend is running
if curl -s http://localhost:8001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend started successfully (PID: $BACKEND_PID)"
else
    echo -e "${RED}✗ Backend failed to start. Check backend.log for errors${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend
echo "Starting frontend on http://localhost:3000 ..."
cd frontend
PORT=3000 yarn start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}✓${NC} Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "=========================================="
echo "  ✅ Services Running!"
echo "=========================================="
echo ""
echo "  Frontend:     http://localhost:3000"
echo "  Backend API:  http://localhost:8001"
echo "  API Docs:     http://localhost:8001/docs"
echo ""
echo "  Backend PID:  $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo "  Logs:"
echo "    Backend:  tail -f backend.log"
echo "    Frontend: tail -f frontend.log"
echo ""
echo "  Press Ctrl+C to stop all services"
echo ""
echo "=========================================="

# Save PIDs to file for stop script
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID 2>/dev/null && echo -e "${GREEN}✓${NC} Backend stopped"
    kill $FRONTEND_PID 2>/dev/null && echo -e "${GREEN}✓${NC} Frontend stopped"
    rm -f .backend.pid .frontend.pid
    echo "Goodbye! 🌾"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Wait indefinitely
while true; do
    sleep 1
    # Check if processes are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}✗ Backend process died. Check backend.log${NC}"
        kill $FRONTEND_PID 2>/dev/null
        exit 1
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}✗ Frontend process died. Check frontend.log${NC}"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
done
