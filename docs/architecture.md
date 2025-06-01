# AI Inference Platform Design

This document describes the architecture of the AI inference platform. The goal is
to expose inference capabilities over Hyperswarm RPC and provide a simple web
interface for account management and metrics.

## Components

- **Inference Worker** – microservice handling inference requests via RPC. It
  extends `base.js` and exposes an RPC method `inference`. The worker also runs a
  small HTTP server used for user registration, usage checks and Prometheus
  metrics.
- **CLI** – command line tool that sends RPC requests to the inference worker.
- **Hyperswarm RPC layer** – lightweight RPC implementation used by the worker
  and CLI. In production it can be replaced by a real Hyperswarm RPC library.

```
flowchart TD
  subgraph Client
    CLI
  end
  subgraph Services
    InferenceWorker
  end
  CLI -- RPC --> InferenceWorker
  WebBrowser -- HTTP --> InferenceWorker
```

## User Flow

1. A user registers via `POST /register` on the worker HTTP interface and
   receives an API key.
2. The API key is stored in the CLI configuration.
3. The CLI issues RPC calls with the API key and a prompt.
4. The worker verifies the key, checks the rate limit, performs the inference
   (here the implementation simply echoes the prompt) and returns the result.
5. Metrics are available on `/metrics` for Prometheus scraping.
