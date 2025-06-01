# API Documentation

## RPC API

### `inference`

Request body:
```
{ "key": "<apiKey>", "prompt": "text" }
```

Response body:
```
{ "reply": "model reply" }
```

Errors are returned as RPC errors in the response.

## HTTP API

### `POST /register`
Create a new user.
Request JSON: `{ "username": "alice" }`
Response JSON: `{ "apiKey": "..." }`

### `GET /usage?key=<apiKey>`
Returns current usage counter.

### `GET /metrics`
Exposes Prometheus metrics.
