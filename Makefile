.PHONY: build test clean deploy init seed play fmt check circuit-compile circuit-setup circuit-prove circuit cranker-install cranker

# Build all contracts
build:
	stellar contract build

# Build with logs enabled
build-debug:
	cargo build --profile release-with-logs

# Run all tests
test:
	cargo test

# Run tests with output
test-verbose:
	cargo test -- --nocapture

# Format code
fmt:
	cargo fmt --all

# Check code without building
check:
	cargo check --all-targets

# Clean build artifacts
clean:
	cargo clean

# Deploy all contracts to testnet
deploy:
	bash scripts/deploy.sh

# Initialize contracts with cross-references
init:
	bash scripts/init.sh

# Seed pool with initial liquidity
seed:
	bash scripts/seed-pool.sh

# Play a test round
play:
	bash scripts/play-round.sh

# Compile circom circuit
circuit-compile:
	cd circuits/roulette && bash scripts/compile.sh

# Run trusted setup
circuit-setup:
	cd circuits/roulette && bash scripts/setup.sh

# Generate proof
circuit-prove:
	cd circuits/roulette && bash scripts/prove.sh

# Full circuit pipeline
circuit: circuit-compile circuit-setup circuit-prove

# Install cranker bot dependencies
cranker-install:
	cd cranker && npm install

# Run cranker bot
cranker:
	cd cranker && node cranker.js
