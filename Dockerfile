# Use an official Node.js runtime as a parent image
ARG NODE_VERSION="20.7.0"
FROM node:${NODE_VERSION}-slim AS base
ARG PNPM_VERSION="8.9.2"
ARG NPM_TOKEN=${NPM_TOKEN}
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare "pnpm@${PNPM_VERSION}" --activate

# Set the working directory to /app
WORKDIR /app
COPY package.json .
COPY pnpm-lock.yaml .

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS dev-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules

# Install app dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-scripts

# Start the application
CMD ["tail", "-f", "/dev/null"]
