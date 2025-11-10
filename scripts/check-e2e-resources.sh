#!/bin/bash
# E2E Test Resource Monitor
# Quick check of system resources during E2E testing

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           E2E Test Environment Resource Monitor                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# System load and uptime
echo "📊 SYSTEM LOAD & UPTIME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
uptime
echo ""

# Memory usage
echo "💾 MEMORY USAGE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
free -h
echo ""

# Disk usage
echo "💿 DISK USAGE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
df -h / | awk 'NR==1 || /\/$/'
echo ""

# Chrome/Chromium process count
echo "🌐 CHROME/CHROMIUM PROCESSES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CHROME_COUNT=$(ps aux | grep -E "headless|chrome|chromium" | grep -v grep | wc -l)
echo "Total processes: $CHROME_COUNT"

if [ "$CHROME_COUNT" -gt 0 ]; then
    echo ""
    echo "Top 5 by CPU usage:"
    ps aux | grep -E "headless|chrome|chromium" | grep -v grep | sort -k3 -rn | head -5 | \
        awk '{printf "  PID: %-7s CPU: %5s%%  MEM: %5s%%  RSS: %6sMB  ELAPSED: %s\n", $2, $3, $4, int($6/1024), $10}'

    echo ""
    echo "Total resource usage:"
    ps aux | grep -E "headless|chrome|chromium" | grep -v grep | \
        awk '{cpu+=$3; mem+=$4; rss+=$6} END {printf "  Combined CPU: %.1f%%  Combined MEM: %.1f%%  Total RSS: %dMB\n", cpu, mem, rss/1024}'
else
    echo "✅ No Chrome processes running (good - all cleaned up!)"
fi
echo ""

# Playwright test runner processes
echo "🎭 PLAYWRIGHT TEST PROCESSES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PW_COUNT=$(pgrep -f "run-playwright.js" | wc -l)
if [ "$PW_COUNT" -gt 0 ]; then
    echo "✓ Playwright test runner is active ($PW_COUNT process)"
    ps aux | grep -F "run-playwright.js" | grep -v grep | \
        awk '{printf "  PID: %-7s CPU: %5s%%  MEM: %5s%%  ELAPSED: %s\n", $2, $3, $4, $10}'
else
    echo "○ No Playwright tests currently running"
fi
echo ""

# Node processes
echo "📦 NODE PROCESSES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
NODE_COUNT=$(pgrep -f "node" | wc -l)
echo "Total node processes: $NODE_COUNT"
if [ "$NODE_COUNT" -gt 0 ]; then
    ps aux | grep -E "node.*playwright|node.*test" | grep -v grep | head -3 | \
        awk '{printf "  %-50s CPU: %5s%% MEM: %5s%%\n", substr($11,1,50), $3, $4}'
fi
echo ""

# uWSGI workers (backend)
echo "🐍 BACKEND (uWSGI) STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
UWSGI_COUNT=$(pgrep -f uwsgi | wc -l)
if [ "$UWSGI_COUNT" -gt 0 ]; then
    echo "✓ uWSGI workers running: $UWSGI_COUNT"
    ps aux | grep uwsgi | grep -v grep | head -4 | \
        awk '{printf "  PID: %-7s CPU: %5s%%  MEM: %5s%%  RSS: %6sMB\n", $2, $3, $4, int($6/1024)}'
else
    echo "⚠ No uWSGI workers detected"
fi
echo ""

# Summary assessment
echo "📋 ASSESSMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get load average (1 min)
LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | xargs)
LOAD_INT=$(echo "$LOAD" | awk '{print int($1)}')

# Get available memory percentage
MEM_AVAIL=$(free | grep Mem | awk '{printf "%.0f", ($7/$2)*100}')

# Check Chrome process count
if [ "$CHROME_COUNT" -eq 0 ]; then
    CHROME_STATUS="✅ Excellent - all cleaned up"
elif [ "$CHROME_COUNT" -lt 10 ]; then
    CHROME_STATUS="✅ Good - minimal processes"
elif [ "$CHROME_COUNT" -lt 20 ]; then
    CHROME_STATUS="⚠️  Moderate - watch for accumulation"
else
    CHROME_STATUS="❌ High - possible resource leak"
fi

echo "Load:   $([ "$LOAD_INT" -lt 8 ] && echo "✅" || echo "⚠️ ")  $LOAD ($(nproc) cores available)"
echo "Memory: $([ "$MEM_AVAIL" -gt 30 ] && echo "✅" || echo "⚠️ ")  $MEM_AVAIL% available"
echo "Chrome: $CHROME_STATUS"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Report generated: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
