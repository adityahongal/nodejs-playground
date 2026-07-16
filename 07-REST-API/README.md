# 07 — REST API with Express

A minimal CRUD REST API for "job applications", built with Express 4.
Data is stored **in memory** (an array), so it resets on every server restart —
that's intentional (a real DB / MongoDB comes later).

## Run it

```bash
# from this folder
node index.js
# → running on http://localhost:3030/api/applications
```
Leave that terminal open (the server stays alive). Press `Ctrl+C` to stop.

## Endpoints

| Method | Endpoint | Action | Success |
|--------|----------------------------|-------------------|---------|
| GET    | `/api/applications`        | list all          | 200     |
| GET    | `/api/applications/:id`    | get one by id     | 200 / 404 |
| POST   | `/api/applications`        | create            | 201     |
| PUT    | `/api/applications/:id`    | update by id      | 200 / 404 |
| DELETE | `/api/applications/:id`    | delete by id      | 204 / 404 |

## Test with curl (open a SECOND terminal)

GET is easy in a browser too — just open the URL. POST/PUT/DELETE need curl (or Postman).

```bash
# GET all
curl http://localhost:3030/api/applications

# GET one
curl http://localhost:3030/api/applications/2

# POST — create (‑X sets method, ‑H sets the header, ‑d is the body data)
curl -X POST http://localhost:3030/api/applications \
  -H "Content-Type: application/json" \
  -d '{"company":"Netflix","role":"UI Engineer","status":"applied"}'

# PUT — update (only send the fields you want to change)
curl -X PUT http://localhost:3030/api/applications/2 \
  -H "Content-Type: application/json" \
  -d '{"status":"interviewing"}'

# DELETE — remove (returns 204 No Content, empty body)
curl -X DELETE http://localhost:3030/api/applications/3

# see status code only (handy for 204/404)
curl -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:3030/api/applications/99
```

### curl flags cheat sheet
- `-X <METHOD>` — HTTP method (GET is default)
- `-H "Content-Type: application/json"` — a request **header**; tells the server the body is JSON (triggers `express.json()`)
- `-d '<json>'` — the request **body** (data)
- `-o /dev/null -w "%{http_code}\n"` — print just the status code

## Prove "in-memory = temporary"
1. POST a new application → GET all shows it.
2. `Ctrl+C` the server, then `node index.js` again.
3. GET all → your added item is **gone**. RAM was wiped → this is why databases exist.
