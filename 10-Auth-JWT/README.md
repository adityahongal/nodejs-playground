# 09 — MongoDB + Mongoose (persistent data)

Same CRUD API as `08-MVC-Patterns`, but the in-memory array is replaced with a real
**MongoDB** database (via **Mongoose**). Data now **survives server restarts**.

`08` = in-memory version (resets on restart) · `09` = persistent version (this folder).

## Structure

```
09-MongoDB-Mongoose/
├── index.js                              entry: dotenv → connectDB() → app + middleware + router + listen
├── config/db.js                          connectDB() — mongoose.connect(process.env.MONGO_URI)
├── models/applicationModel.js            Mongoose Schema + Model (the ONLY layer that talks to Mongo)
├── controllers/applicationController.js  5 async controllers (find / findById / create / findByIdAndUpdate / findByIdAndDelete)
└── routes/applicationRoutes.js           method + path → controller
```

**Request flow:** `Request → routes → controller → Model → MongoDB Atlas → response`

## Key ideas
- **Schema = blueprint (inert)**, **Model = live DB-connected tool** (`.find()`, `.create()`…). `mongoose.model("Application", schema)` compiles one into the other; docs land in the pluralized **`applications`** collection.
- Schema enforces shape MongoDB alone won't: `required`, `enum`, `default`, `{ timestamps: true }` (auto `createdAt`/`updatedAt`). Mongo auto-adds a unique **`_id`** (ObjectId string — no manual id).
- Every controller is **`async` + `try/catch` + `await Application.…()`** (DB access is network I/O).
- **404 = a null-guard** (query succeeded, found nothing), **500 = the catch** (something broke). Guard clauses must `return`.
- `findByIdAndUpdate(id, req.body, { new: true, runValidators: true })` — return the *updated* doc + re-run validation.

## Setup (one-time)
1. Create a free **MongoDB Atlas** cluster + DB user; allow network access.
2. `npm install mongoose dotenv` (already in the shared root `package.json`).
3. Create a **git-ignored `.env`** at the repo root:
   ```
   MONGO_URI=mongodb+srv://<user>:<password>@<host>/jobtracker?retryWrites=true&w=majority
   ```
   ⚠️ Never commit `.env` — it holds the DB password.

## Run it (from the repo root, so dotenv finds the root `.env`)

```bash
node 09-MongoDB-Mongoose/index.js
# → MVC API running on http://localhost:3030/api/applications
# → MongoDB connected successfully
```
Leave it running; `Ctrl+C` to stop. Data lives in Atlas → **persists across restarts**.

## Test with curl (second terminal)

```bash
BASE=http://localhost:3030/api/applications

# GET all
curl $BASE

# POST — create (201). No id/status needed → Mongoose fills _id, status:"applied", timestamps
curl -X POST $BASE -H "Content-Type: application/json" \
  -d '{"company":"Google","role":"Frontend Developer"}'

# copy an _id from the output, then:
ID=<paste-_id-here>

# GET one (200) / missing (404)
curl $BASE/$ID
curl $BASE/000000000000000000000000

# PUT — update (200, returns the UPDATED doc thanks to new:true)
curl -X PUT $BASE/$ID -H "Content-Type: application/json" -d '{"status":"interview"}'

# schema validation — missing required field → 500 with a validation message
curl -X POST $BASE -H "Content-Type: application/json" -d '{"company":"NoRole Inc"}'

# DELETE — (204 No Content) / missing (404)
curl -i -X DELETE $BASE/$ID
```

### Prove persistence 🏆
Create a doc → `Ctrl+C` the server → restart → `curl $BASE` → **the data is still there.**
(With `08`'s in-memory array it would have been wiped.) See it in the cloud at
**Atlas → Browse Collections → `jobtracker` → `applications`**.

### curl flags
- `-X <METHOD>` — HTTP method (default GET)
- `-H "Content-Type: application/json"` — header saying the body is JSON (triggers `express.json()`)
- `-d '<json>'` — request body
- `-i` — include response headers (handy for `204`, which has no body)
