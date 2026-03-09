#!/bin/bash

# NEXIS GUARDIAN v1.0
# Automated Security Monitoring & Mitigation Script

LOG_FILE="/var/log/nexis-guardian.log"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# 1. PROCESS MONITORING
SUSPICIOUS_PROCS=$(ps aux | grep -E "xdlol|spc|\.x86" | grep -v grep)

if [ ! -z "$SUSPICIOUS_PROCS" ]; then
    echo "[$TIMESTAMP] ALERT: Suspicious processes detected!" >> $LOG_FILE
    echo "$SUSPICIOUS_PROCS" >> $LOG_FILE
    pkill -9 -f xdlol
    pkill -9 -f spc
    pkill -9 -f .x86
    echo "[$TIMESTAMP] ACTION: Killed suspicious processes." >> $LOG_FILE
fi

# 2. FILE INTEGRITY MONITORING
SUSPICIOUS_FILES=$(find /tmp /root -maxdepth 2 -type f -executable -not -name "*.sh" -not -name "node" -not -name "npm" 2>/dev/null)

if [ ! -z "$SUSPICIOUS_FILES" ]; then
    echo "[$TIMESTAMP] ALERT: Suspicious executable files found!" >> $LOG_FILE
    echo "$SUSPICIOUS_FILES" >> $LOG_FILE
    rm -f $SUSPICIOUS_FILES
    echo "[$TIMESTAMP] ACTION: Removed suspicious files." >> $LOG_FILE
fi

# 3. NETWORK CONNECTIONS
OUTBOUND_CONN=$(ss -ntpu | grep -E ":23 |:2323 |:37215 " 2>/dev/null)

if [ ! -z "$OUTBOUND_CONN" ]; then
    echo "[$TIMESTAMP] ALERT: Unauthorized outbound traffic detected!" >> $LOG_FILE
    echo "$OUTBOUND_CONN" >> $LOG_FILE
fi

# 4. APP STATUS MONITORING
APP_STATUS=$(pm2 jlist | grep "online" 2>/dev/null)
if [ -z "$APP_STATUS" ]; then
    echo "[$TIMESTAMP] WARNING: Application process is NOT online." >> $LOG_FILE
fi
