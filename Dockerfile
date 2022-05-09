FROM ubuntu:20.04
ARG NPM_AUTH_TOKEN
ARG BUILDKITE_ACCESS_TOKEN
RUN apt-get update \
        && apt-get upgrade -y \
        && apt-get autoremove \
        && apt-get install -y build-essential git curl netcat && \
        curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
        apt-get install -y nodejs && npm install pm2@latest -g && \
        apt-get install -y jq

WORKDIR /hyperion-history-api
COPY . .
COPY .npmrc.template .npmrc
RUN npm ci && \
      ./scripts/getBuildkiteArtifact.sh

RUN adduser --system --group voice && chown -R voice:voice /hyperion-history-api
USER voice

EXPOSE 7000
