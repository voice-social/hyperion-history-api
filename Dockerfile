FROM gcr.io/voice-dev-infra-services/voice/hyperion-explorer-plugin:latest as explorer
FROM gcr.io/voice-dev-infra-services/voice/hyperion-explorer-plugin:latest as sa

FROM gcr.io/voice-ops-dev/alpine-node:16
ARG BUILDKITE_ACCESS_TOKEN
USER root
RUN apk install jq && npm install pm2@latest -g
USER voice
COPY --chown=voice:voice . .
COPY --chown=voice:voice --from=explore explorer /opt/app/hyperion-history-api/plugins/repos/explorer
COPY --chown=voice:voice --from=sa sa /opt/app/hyperion-history-api/plugins/repos/sa
RUN mv .npmrc.template .npmrc && \
 npm ci && \
 rm .npmrc && \
 pm2 startup

EXPOSE 7000
