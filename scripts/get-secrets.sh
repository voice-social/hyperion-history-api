#!/bin/bash
set -eu

jq -n --arg  elastic_user $ELASTIC_USER --arg  elastic_pass $ELASTIC_PASS --arg elastic_host $ELASTIC_HOST \
    '.elasticsearch.user = $elastic_user | .elasticsearch.pass =  $elastic_pass | .elasticsearch.host = $elastic_host | .elasticsearch.ingest_nodes = [$elastic_host] '  \
    /tmp/connections.json > /hyperion-history-api/connections.json

jq --arg  server_name $SERVER_NAME  --arg  pod_ip $POD_IP \
    '.api.server_name = $server_name |.api.server_addr = $POD_IP'  /tmp/voice.config.json> /hyperion-history-api/chains/voice.config.json
./run.sh $@
