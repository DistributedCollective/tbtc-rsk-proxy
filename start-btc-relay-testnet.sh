#!/bin/bash

TARGET_URL="http://127.0.0.1" \
TARGET_PORT=18332 \
TARGET_USERNAME="user" \
TARGET_PASSWORD="password" \
PROXY_PORT=6061 \
MATCH_REQUESTS=0 \
MUTE_LOGGING=0 \
pm2-runtime -i 1 btc.js 
