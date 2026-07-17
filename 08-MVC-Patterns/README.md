# 08 — REST API refactored into MVC

Same CRUD API as `07-REST-API`, but split by responsibility (MVC-style).
Behaviour is identical — this folder is about **structure**, not new features.

## Structure

```
08-MVC-Patterns/
├── index.js                          entry point: app + middleware + mount router + listen
├── models/applicationModel.js        DATA layer (the applications array)
├── controllers/applicationController.js  LOGIC layer (getAll, getOne, create, update, remove)
└── routes/applicationRoutes.js       ROUTES layer (method + path → controller)
```

**Request flow:** `Request → routes → controller → model → response`

Key ideas:
- `express.Router()` = a mini-app holding routes; paths are relative (`/`, `/:id`).
- `app.use("/api/applications", router)` **mounts** the router — that base path is prepended to every router path (so `router.get("/")` → `GET /api/applications`).
- `app.use(express.json())` middleware lives in `index.js` (app-level).
- DELETE uses `findIndex` + `splice` (mutate the shared array) — NOT `filter` (reassign), because imported bindings are read-only and reassignment desyncs the model.

## Run it

```bash
# from this folder
node index.js
# → MVC API running on http://localhost:3030/api/applications
```
Leave it running; `Ctrl+C` to stop. Data is in-memory → resets on restart.

## Test with curl (second terminal)

```bash
# GET all
curl http://localhost:3030/api/applications

# GET one (200) / missing (404)
curl http://localhost:3030/api/applications/2
curl http://localhost:3030/api/applications/99

# POST — create (201)
curl -X POST http://localhost:3030/api/applications \
  -H "Content-Type: application/json" \
  -d '{"company":"Netflix","role":"UI Engineer","status":"applied"}'

# PUT — update (200) / missing (404)
curl -X PUT http://localhost:3030/api/applications/2 \
  -H "Content-Type: application/json" \
  -d '{"status":"interviewing"}'

# DELETE — remove (204) / missing (404)
curl -X DELETE http://localhost:3030/api/applications/3

# show ONLY the status code (handy for 204/404 which have no/short body)
curl -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:3030/api/applications/99
```

### curl flags
- `-X <METHOD>` — HTTP method (default GET)
- `-H "Content-Type: application/json"` — header saying the body is JSON (triggers `express.json()`)
- `-d '<json>'` — request body
- `-o /dev/null -w "%{http_code}\n"` — print just the status code
