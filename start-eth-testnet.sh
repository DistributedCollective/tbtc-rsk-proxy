#!/bin/bash

TARGET_URL="wss://testnet.sovryn.app/ws" \
TARGET_PORT=443 \
PROXY_PORT=5050 \
HTTP_MODE=0 \
MATCH_REQUESTS=0 \
MUTE_LOGGING=0 \
pm2-runtime -i 4 eth.js 
