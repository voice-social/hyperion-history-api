#!/usr/bin/env bash

jq --arg  pod_ip $POD_IP \
    '.api.server_addr = $POD_IP'  /hyperion-history-api/chains/voice.config.json > /hyperion-history-api/chains/tmp.json && \
    mv /hyperion-history-api/chains/tmp.json /hyperion-history-api/chains/voice.config.json

if [ $# -eq 0 ]; then
  echo 'Please inform the app name. ex: "./run.sh indexer"'
  exit 1
fi
echo -e "\n-->> Starting $1..."
(
  set -x
  pm2 start --only "$@" --update-env --silent
)
echo -e "\n-->> Saving pm2 state..."
(
  set -x
  pm2 save
)
echo -e "\n-->> Reading $1 logs..."
(
  set -x
  pm2 logs --raw --lines 10 "$@"
)
