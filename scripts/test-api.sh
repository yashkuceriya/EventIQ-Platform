#!/bin/bash

API_URL="http://localhost:3001"

echo "🧪 Testing EventIQ API..."
echo ""

# Submit test event
echo "📤 Submitting test event..."
curl -X POST $API_URL/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test.event",
    "source": "test-script",
    "severity": "low",
    "message": "Test event from API test script",
    "metadata": {
      "test": true,
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
    }
  }'

echo ""
echo ""

# Get metrics
echo "📊 Fetching metrics..."
curl $API_URL/api/metrics

echo ""
echo ""
echo "✅ API test complete!"
