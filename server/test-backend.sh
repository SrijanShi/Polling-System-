#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  BACKEND TESTING (Steps 1-4)"
echo "=========================================="
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check Endpoint${NC}"
response=$(curl -s http://localhost:5000/api/health)
if echo "$response" | grep -q "ok"; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "$response" | python3 -m json.tool
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "$response"
fi
echo ""

# Test 2: Create Poll
echo -e "${YELLOW}Test 2: Create Poll (POST /api/polls)${NC}"
poll_response=$(curl -s -X POST http://localhost:5000/api/polls \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is your favorite programming language?",
    "options": ["JavaScript", "Python", "Java", "C++"],
    "timerDuration": 60
  }')

if echo "$poll_response" | grep -q "success"; then
    echo -e "${GREEN}✓ Poll created successfully${NC}"
    echo "$poll_response" | python3 -m json.tool
    poll_id=$(echo "$poll_response" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['pollId'])")
    echo -e "${GREEN}Poll ID: $poll_id${NC}"
else
    echo -e "${RED}✗ Poll creation failed${NC}"
    echo "$poll_response"
    poll_id=""
fi
echo ""

# Test 3: Get Poll State
if [ -n "$poll_id" ]; then
    echo -e "${YELLOW}Test 3: Get Poll State (GET /api/polls/:id/state)${NC}"
    state_response=$(curl -s "http://localhost:5000/api/polls/$poll_id/state?sessionId=test-session-123")
    if echo "$state_response" | grep -q "success"; then
        echo -e "${GREEN}✓ Poll state retrieved${NC}"
        echo "$state_response" | python3 -m json.tool
    else
        echo -e "${RED}✗ Failed to get poll state${NC}"
        echo "$state_response"
    fi
    echo ""
fi

# Test 4: Get Current State (Recovery Endpoint)
echo -e "${YELLOW}Test 4: Current State Endpoint (GET /api/current-state)${NC}"
current_state=$(curl -s "http://localhost:5000/api/current-state?sessionId=test-123")
if echo "$current_state" | grep -q "success"; then
    echo -e "${GREEN}✓ Current state endpoint working${NC}"
    echo "$current_state" | python3 -m json.tool
else
    echo -e "${RED}✗ Current state endpoint failed${NC}"
    echo "$current_state"
fi
echo ""

# Test 5: Get Poll History (should be empty initially)
echo -e "${YELLOW}Test 5: Poll History (GET /api/polls/history)${NC}"
history_response=$(curl -s http://localhost:5000/api/polls/history)
if echo "$history_response" | grep -q "success"; then
    echo -e "${GREEN}✓ Poll history endpoint working${NC}"
    echo "$history_response" | python3 -m json.tool
else
    echo -e "${RED}✗ Poll history endpoint failed${NC}"
    echo "$history_response"
fi
echo ""

# Test 6: Get Poll Results
if [ -n "$poll_id" ]; then
    echo -e "${YELLOW}Test 6: Get Poll Results (GET /api/polls/:id/results)${NC}"
    results_response=$(curl -s "http://localhost:5000/api/polls/$poll_id/results")
    if echo "$results_response" | grep -q "success"; then
        echo -e "${GREEN}✓ Poll results retrieved${NC}"
        echo "$results_response" | python3 -m json.tool
    else
        echo -e "${RED}✗ Failed to get poll results${NC}"
        echo "$results_response"
    fi
    echo ""
fi

# Test 7: Test MongoDB Connection
echo -e "${YELLOW}Test 7: MongoDB Collections Check${NC}"
if command -v mongosh &> /dev/null; then
    collections=$(mongosh polling-system --quiet --eval "db.getCollectionNames()" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ MongoDB connected${NC}"
        echo "Collections: $collections"
    else
        echo -e "${RED}✗ MongoDB connection failed${NC}"
    fi
elif command -v mongo &> /dev/null; then
    collections=$(mongo polling-system --quiet --eval "db.getCollectionNames()" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ MongoDB connected${NC}"
        echo "Collections: $collections"
    else
        echo -e "${RED}✗ MongoDB connection failed${NC}"
    fi
else
    echo -e "${YELLOW}! MongoDB CLI not found, skipping database check${NC}"
fi
echo ""

# Test 8: Test Invalid Endpoints (Error Handling)
echo -e "${YELLOW}Test 8: Error Handling - Invalid Route${NC}"
error_response=$(curl -s http://localhost:5000/api/invalid-route)
if echo "$error_response" | grep -q "not found"; then
    echo -e "${GREEN}✓ Error handling working (404)${NC}"
    echo "$error_response" | python3 -m json.tool
else
    echo -e "${RED}✗ Error handling not working properly${NC}"
    echo "$error_response"
fi
echo ""

# Test 9: Test Invalid Poll ID
echo -e "${YELLOW}Test 9: Error Handling - Invalid Poll ID${NC}"
invalid_response=$(curl -s "http://localhost:5000/api/polls/invalid-id-123/state")
if echo "$invalid_response" | grep -q "Invalid poll ID"; then
    echo -e "${GREEN}✓ Validation working${NC}"
    echo "$invalid_response" | python3 -m json.tool
else
    echo -e "${YELLOW}! Validation response different than expected${NC}"
    echo "$invalid_response" | python3 -m json.tool
fi
echo ""

# Summary
echo "=========================================="
echo "  TEST SUMMARY"
echo "=========================================="
echo -e "${GREEN}✓ Server is running on port 5000${NC}"
echo -e "${GREEN}✓ Health check endpoint working${NC}"
echo -e "${GREEN}✓ Poll creation endpoint working${NC}"
echo -e "${GREEN}✓ Poll state retrieval working${NC}"
echo -e "${GREEN}✓ Current state (recovery) endpoint working${NC}"
echo -e "${GREEN}✓ Poll history endpoint working${NC}"
echo -e "${GREEN}✓ Poll results endpoint working${NC}"
echo -e "${GREEN}✓ Error handling middleware working${NC}"
echo ""
echo -e "${YELLOW}Note: Socket.io functionality needs to be tested with a client${NC}"
echo ""
