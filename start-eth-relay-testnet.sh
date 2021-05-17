#!/bin/bash

TARGET_URL="https://testnet.sovryn.app/rpc" \
TARGET_PORT=443 \
PROXY_PORT=6060 \
HTTP_MODE=1 \
MATCH_REQUESTS=0 \
MUTE_LOGGING=0 \
pm2-runtime -i 1 eth.js 
