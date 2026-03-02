#!/bin/bash
npm run dev > .next.log 2>&1 &
PID=$!
sleep 10
npx tsx test-curl.ts
kill -9 $PID
