#!/bin/bash
# This script monitors the number of threads in the Django container
# and logs the results to a file.
# It is used to help diagnose issues with the Django application.

  LOG_FILE="/tmp/django-thread-monitor-$(date +%Y%m%d-%H%M%S).log"
  echo "=== Django Thread Monitor ===" | tee "$LOG_FILE"
  echo "Started at: $(date)" | tee -a "$LOG_FILE"
  echo "Log file: $LOG_FILE" | tee -a "$LOG_FILE"
  echo "" | tee -a "$LOG_FILE"

  # Find Django container (adjust name if different)
  CONTAINER=$(docker ps --format '{{.Names}}' | grep -i django | head -1)
  if [ -z "$CONTAINER" ]; then
      echo "ERROR: No Django container found"
      exit 1
  fi
  echo "Monitoring container: $CONTAINER" | tee -a "$LOG_FILE"
  echo "" | tee -a "$LOG_FILE"

  while true; do
      THREAD_COUNT=$(docker exec "$CONTAINER" ps -eLf 2>/dev/null | wc -l || echo "error")
      TIMESTAMP=$(date '+%H:%M:%S')
      echo "$TIMESTAMP - Threads: $THREAD_COUNT" | tee -a "$LOG_FILE"
      sleep 30
  done
