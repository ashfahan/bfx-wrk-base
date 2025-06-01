# AI Inference Platform Sample

This repository contains a minimal microservice-based inference platform that
follows the paradigm of `base.js`. The platform exposes an RPC interface over a
lightweight Hyperswarm RPC implementation and provides a small web interface for
user management and metrics.

## Quickstart

1. Install dependencies (none are required besides Node.js).
2. Start the worker:
   ```bash
   npm start
   ```
   The worker listens for RPC connections on port `9000` and HTTP on port `9001`.

3. Register a user:
   ```bash
   curl -X POST -d '{"username":"alice"}' http://localhost:9001/register
   ```
   Save the returned `apiKey` in `cli/config.json`.

4. Run the CLI:
   ```bash
   node cli/index.js "your prompt here"
   ```

5. Metrics are available on `http://localhost:9001/metrics`.

## Tests

Run unit tests with:
```
npm test
```

For detailed design notes see [docs/architecture.md](docs/architecture.md).
