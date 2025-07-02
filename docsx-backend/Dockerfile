# -------- STAGE 1: Prepare dependencies with cargo-chef --------
FROM rust:1.82-slim AS chef
WORKDIR /app

RUN apt-get update && apt-get install -y pkg-config libssl-dev curl ca-certificates && apt-get clean
RUN cargo install cargo-chef --version 0.1.71

COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN cargo chef prepare --recipe-path recipe.json

# -------- STAGE 2: Build dependencies --------
FROM rust:1.82-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y pkg-config libssl-dev curl ca-certificates && apt-get clean
RUN cargo install cargo-chef

COPY --from=chef /app/recipe.json recipe.json
COPY Cargo.toml Cargo.lock ./
RUN cargo chef cook --recipe-path recipe.json

# Copy full source and build the app
COPY . .

RUN cargo build --release

# -------- STAGE 3: Runtime image --------
FROM debian:bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y libssl-dev ca-certificates && apt-get clean

COPY --from=builder /app/target/release/docsx-backend .

ENV PORT=8080
EXPOSE 8080

CMD ["./docsx-backend"]