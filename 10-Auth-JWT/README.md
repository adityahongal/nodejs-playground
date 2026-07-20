# 10 — Auth: JWT + bcrypt (accounts + protected, per-user data)

Builds on `09-MongoDB-Mongoose`. Adds **user accounts**: sign up, log in, and each user
sees/modifies **only their own** applications. Two new packages: **`bcryptjs`** (hash
passwords) + **`jsonwebtoken`** (JWTs).

`09` = open API (anyone can hit it) · `10` = protected API (login required, data scoped to owner).

## What's new vs 09

```
10-Auth-JWT/
├── models/userModel.js            NEW — User schema; bcrypt pre-save hash + matchPassword method
├── models/applicationModel.js     + owner field (ObjectId ref → User) = foreign key
├── controllers/authController.js  NEW — registerUser + loginUser (issue JWT)
├── controllers/applicationController.js  all 5 fns scoped to req.user._id (authZ)
├── routes/authRoutes.js           NEW — POST /register, /login (mounted at /api/auth)
├── routes/applicationRoutes.js    + router.use(protect) — every route needs a valid token
├── middleware/authMiddleware.js   NEW — protect: verify JWT → attach req.user
├── utils/generateToken.js         NEW — jwt.sign({ id }, JWT_SECRET, { expiresIn })
└── index.js                       mounts BOTH routers (/api/applications + /api/auth)
```

## Key ideas
- **authN vs authZ:** `protect` middleware = "are you logged in?" (token). Owner scoping = "is this row yours?".
- **bcrypt:** one-way hashing + salt; `genSalt(10)` → `10` is the cost/work factor, not salt length. Hash on register (pre-save hook), `bcrypt.compare` on login.
- ⚠️ **Mongoose gotchas:** register hooks/methods BEFORE `mongoose.model()`; Mongoose 7+ async hooks take **no `next`** (`return` to skip, resolve to proceed).
- **JWT:** signed (not encrypted) → payload holds only the user `_id`; same `JWT_SECRET` signs + verifies. Server is stateless (stores no token).
- **owner = foreign key:** `{ type: ObjectId, ref: "User" }` stores a copy of the User's `_id`. Queries scoped with `findOne({ _id, owner: req.user._id })` prevent **IDOR** (touching others' data).

## Setup
1. `npm install bcryptjs jsonwebtoken` (already in the shared root `package.json`).
2. Add to the git-ignored root `.env` (alongside `MONGO_URI`):
   ```
   JWT_SECRET=<a long random string>
   JWT_EXPIRES_IN=7d
   ```
   ⚠️ If `JWT_SECRET` leaks, anyone can forge tokens. Never commit `.env`.

## Run it (from the repo root)
```bash
node 10-Auth-JWT/index.js
# → API running on http://localhost:3030
# → MongoDB connected successfully
```

## Test with curl (second terminal)
```bash
API=http://localhost:3030/api

# 1. REGISTER → 201 + token
curl -s -X POST $API/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@t.com","password":"secret123"}'

# 2. LOGIN → 200 + token   (copy the token string)
curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"alice@t.com","password":"secret123"}'
TOKEN=<paste-token-here>

# 3. protected route WITHOUT token → 401
curl -s $API/applications

# 4. protected route WITH token → 200 (only YOUR apps)
curl -s $API/applications -H "Authorization: Bearer $TOKEN"

# 5. create an application (owner auto-stamped from the token)
curl -s -X POST $API/applications -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"company":"Google","role":"Frontend Developer"}'
```

### Prove the security 🔒
Register a **second** user, have them create their own app, then try to `GET`/`DELETE`
the **first** user's application id with the second user's token → you get **404**
(IDOR blocked — you can only ever touch your own data). Verified via `scratchpad/sectest.mjs`
during the build.

### Endpoints
| Method + path | Auth | Purpose |
|---|---|---|
| POST `/api/auth/register` | public | create account, returns token |
| POST `/api/auth/login` | public | verify credentials, returns token |
| GET/POST `/api/applications` | 🔒 token | list / create (scoped to you) |
| GET/PUT/DELETE `/api/applications/:id` | 🔒 token | read / update / delete YOUR app only |
