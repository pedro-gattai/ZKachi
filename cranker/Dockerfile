FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates libdbus-1-3 \
    && rm -rf /var/lib/apt/lists/*

# Install Stellar CLI
RUN curl -fsSL https://github.com/stellar/stellar-cli/raw/main/install.sh | sh

WORKDIR /app

# Copy circuit artifacts (needed by snarkjs for proof generation)
COPY circuits/roulette/build/roulette_js/roulette.wasm circuits/roulette/build/roulette_js/roulette.wasm
COPY circuits/roulette/build/roulette_final.zkey circuits/roulette/build/roulette_final.zkey

# Install cranker dependencies
COPY cranker/package*.json cranker/
RUN cd cranker && npm ci --omit=dev

# Copy cranker source
COPY cranker/ cranker/

WORKDIR /app/cranker

# Startup: configure stellar identity from env var, then run bot
# SOURCE defaults to "deployer" (matching the project's .env)
CMD sh -c '\
  if [ -n "$STELLAR_SECRET" ]; then \
    echo "$STELLAR_SECRET" | stellar keys add ${SOURCE:-deployer} --secret-key; \
  fi && \
  node cranker.js'
