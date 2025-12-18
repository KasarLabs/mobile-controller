FROM oven/bun:1 AS base

# Install common utilities
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json bun.lock* ./

# Install dependencies using bun
RUN bun install

# Copy source files
COPY src ./src
COPY tsconfig.json ./

# Copy local documentation files containing docs.md
COPY local ./local

# Build TypeScript files
RUN bun run build

# Set working directory to app root
WORKDIR /app

# Run the ingestion script with yes mode enabled
CMD ["bun", "run", "dist/ingesters/docs/core/generateEmbeddings.js", "--yes"]
