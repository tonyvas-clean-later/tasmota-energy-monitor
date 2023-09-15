#!/usr/bin/bash

SCRIPT_PATH="/root/webservers/tasmota-energy-monitor"

cd "${SCRIPT_PATH}"
node app.js 2>&1 | tee loggy.log
