#!/bin/bash

echo "🧹 Clearing Formbricks Cache..."
echo ""

# Clear Redis cache
echo "1/3 Clearing Redis cache..."
docker exec docker-redis-1 redis-cli FLUSHALL > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "   ✅ Redis cache cleared"
else
    echo "   ⚠️  Redis cache clear failed (container might not be running)"
fi

# Restart Formbricks app
echo "2/3 Restarting Formbricks application..."
docker-compose restart formbricks > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "   ✅ Formbricks restarted"
else
    echo "   ⚠️  Formbricks restart failed"
fi

echo "3/3 Done!"
echo ""
echo "✅ Cache cleared successfully!"
echo "📝 Don't forget to hard refresh your browser: Cmd+Shift+R"
