#!/usr/bin/env bash
export no_proxy="${no_proxy},0.0.0.0"
export GLOBAL_AGENT_NO_PROXY="${GLOBAL_AGENT_NO_PROXY},0.0.0.0"
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
