ARG NODE_VERSION=21.7.3
FROM node:${NODE_VERSION}-alpine AS node

FROM mcr.microsoft.com/devcontainers/base:alpine-3.20

COPY --from=node /usr/lib /usr/lib
COPY --from=node /usr/local/lib /usr/local/lib
COPY --from=node /usr/local/include /usr/local/include
COPY --from=node /usr/local/bin /usr/local/bin

RUN apk add --no-cache curl \
    git \
    docker \
    docker-compose

# Install NPM, PNPM, and Payload CMS CLI
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

# Configure Docker group and user
RUN addgroup vscode docker && \
    npm install -g pnpm