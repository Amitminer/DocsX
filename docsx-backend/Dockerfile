FROM rust:1.82-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y pkg-config libssl-dev curl ca-certificates && apt-get clean

COPY . .

RUN cargo build --release

# --- Runtime ---
FROM debian:bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y libssl-dev ca-certificates && apt-get clean

COPY --from=builder /app/target/release/docsx-backend .

ENV PORT=8080
EXPOSE 8080

CMD ["./docsx-backend"]
