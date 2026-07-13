# Node.js — Interview Prep Notes

> Pure interview-focused Q&A with code snippets. Skim before interviews.
> Grows as I learn. ⭐ = high-frequency question.

---

## 1. Node Fundamentals

### ⭐ Q: What is Node.js?
A runtime that lets JavaScript run **outside the browser**, built on Chrome's **V8** engine. It's **single-threaded, event-driven, and non-blocking (async I/O)** — which makes it great for I/O-heavy apps like APIs and real-time servers.

### ⭐ Q: Is Node a language or a framework?
Neither — it's a **runtime environment**. The language is JavaScript. Express is a framework that runs *on* Node.

### Q: What is V8?
Google's open-source JS engine (also in Chrome). It compiles JS to machine code. Node embeds V8 and adds server-side APIs (file system, networking) that browsers don't have.

### ⭐ Q: Why is Node good for some apps and bad for others?
- **Good for:** I/O-bound work (APIs, DB calls, streaming, real-time) — non-blocking model handles many concurrent connections cheaply.
- **Bad for:** CPU-heavy work (video encoding, heavy math) — one long computation blocks the single thread.

---

## 2. Blocking vs Non-Blocking / Sync vs Async

### ⭐ Q: What does "non-blocking" mean?
Node doesn't wait for slow operations (file read, DB, network). It starts them, keeps running other code, and handles the result later via a callback/promise.

```js
import fs from "fs";

// BLOCKING (synchronous) — freezes everything until file is read
const data = fs.readFileSync("file.txt", "utf-8");
console.log(data);
console.log("runs AFTER file is read");

// NON-BLOCKING (asynchronous) — keeps going, callback runs later
fs.readFile("file.txt", "utf-8", (err, data) => {
  if (err) throw err;
  console.log(data);
});
console.log("runs BEFORE file is read"); // prints first!
```

### ⭐ Q: Why avoid blocking code in a server?
Node is **single-threaded** — a blocking call freezes the ENTIRE server, so no other request can be handled until it finishes. Always prefer async versions.

---

## 3. The Event Loop (⭐ very common)

### ⭐ Q: How does Node handle concurrency if it's single-threaded?
The **event loop**. Node offloads slow I/O to the system (via libuv), keeps executing other code, and when an operation finishes, its callback is queued and run. One thread, but never idle-waiting.

### Q: What is libuv?
A C library Node uses under the hood. It provides the **event loop** and a **thread pool** for operations the OS can't do async natively (e.g. file system, DNS).

### Q: Simple mental model
```
Call Stack runs your code
   ↓ hits an async op (setTimeout, fs.readFile, DB call)
   → handed off to Node/libuv (runs in background)
   → when done, callback goes to a queue
   ↓ Event Loop picks queued callbacks and runs them when stack is empty
```

### Q: What does this print and why?
```js
console.log("1");
setTimeout(() => console.log("2"), 0);
console.log("3");
// Output: 1, 3, 2
```
Even with `0ms`, `setTimeout`'s callback is queued and only runs **after** the current synchronous code finishes.

---

## 4. Modules: CommonJS vs ES Modules (⭐ often missed, often asked)

### ⭐ Q: What's the difference between CommonJS and ES Modules?
| | CommonJS (CJS) | ES Modules (ESM) |
|---|---|---|
| Import | `const x = require("x")` | `import x from "x"` |
| Export | `module.exports = x` | `export default x` / `export {}` |
| Default in Node | Yes (classic) | Needs `"type": "module"` in package.json (or `.mjs`) |
| Loading | Synchronous | Asynchronous |
| Origin | Node's original system | Modern JS standard (same as browser) |

```js
// ---- CommonJS ----
// math.js
function add(a, b) { return a + b; }
module.exports = { add };
// app.js
const { add } = require("./math");

// ---- ES Modules ----
// math.js
export function add(a, b) { return a + b; }
// app.js
import { add } from "./math.js";
```

### Q: How do you enable ES Modules in Node?
Add `"type": "module"` to `package.json`, OR name files `.mjs`. Without it, `import` throws a SyntaxError.

### ⭐ Q: Named vs default export?
```js
export default function () {}     // one per file → import anyName from "./x.js"
export const a = 1;               // many per file → import { a } from "./x.js"
```

### Q: Built-in vs third-party modules?
- **Built-in** ship with Node, no install: `http`, `fs`, `path`, `os`, `crypto`, `events`.
- **Third-party** from npm, must install: `express`, etc.
- ⚠️ Never `npm install` a built-in (e.g. `http`) — you'll download a fake placeholder package.

---

## 5. The `http` Module — Creating a Server

### ⭐ Q: Create a basic HTTP server without any framework.
```js
import http from "http";

const server = http.createServer((req, res) => {
  // basic routing on the URL
  if (req.url === "/") res.end("Home page");
  else if (req.url === "/about") res.end("About page");
  else res.end("Not found");
});

server.listen(5030, () => console.log("running on http://localhost:5030"));
```

### ⭐ Q: What are `req` and `res`?
- **`req`** (request): what the client sent — READ from it. Key props: `req.url`, `req.method`, headers, body.
- **`res`** (response): what you send back — WRITE to it. `res.statusCode`, `res.setHeader()`, `res.end()`.
- Analogy: `req` = order slip, `res` = the plate you serve back.

### ⭐ Q: Why does `createServer` take a callback?
Node is event-driven. You don't know *when* a request will arrive, so you register a function Node **calls back** on every request. `listen`'s callback runs once, when the server is ready.

### ⭐ Q: Common bug — what is `ERR_STREAM_WRITE_AFTER_END`?
Calling `res.end()` **more than once** per request. You can only "serve the plate" once. Ensure exactly one `res.end()` per request path.

### Q: Send JSON instead of plain text?
```js
const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "hello" }));
});
```

### Q: What is `EADDRINUSE`?
"Address already in use" — another process is on that port. Two servers can't share a port. Kill the old one (`Ctrl+C`) or use a different port.

---

## 6. HTTP Methods & Status Codes (⭐ REST basics)

### ⭐ Q: Main HTTP methods and their CRUD mapping?
| Method | CRUD | Use |
|---|---|---|
| GET | Read | Fetch data (no body, safe, idempotent) |
| POST | Create | Create new resource (has body) |
| PUT | Update | Replace a resource fully |
| PATCH | Update | Update part of a resource |
| DELETE | Delete | Remove a resource |

### ⭐ Q: Common status codes?
- **2xx success:** `200 OK`, `201 Created`, `204 No Content`
- **4xx client error:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`
- **5xx server error:** `500 Internal Server Error`

### Q: Idempotent vs safe?
- **Safe:** doesn't change data (GET).
- **Idempotent:** same result if called multiple times (GET, PUT, DELETE). POST is NOT idempotent (creates duplicates).

---

## 7. npm & Project Structure

### ⭐ Q: What does `package.json` do?
The project's manifest: name, version, scripts, and **dependency list**. Created by `npm init` (run once per project).

### Q: `npm init` vs `npm install`?
| Command | Creates |
|---|---|
| `npm init` (`-y` for defaults) | `package.json` only |
| `npm install <pkg>` | `node_modules/` + adds pkg to dependencies + `package-lock.json` |

### ⭐ Q: Should you commit `node_modules`? Why not?
No. It's large and **fully rebuildable** from `package.json` + `package-lock.json` via `npm install`. Git-ignore it (`**/node_modules`). Anyone cloning runs `npm install`.

### Q: What is `package-lock.json`?
Records the **exact** versions of every installed package (and sub-dependency) so installs are reproducible across machines. Commit this one.

### Q: dependencies vs devDependencies?
- `dependencies`: needed at runtime (e.g. `express`).
- `devDependencies`: needed only in development (e.g. `nodemon`, test tools). Install with `npm install -D <pkg>`.

### Q: What is `nodemon`?
A dev tool that **auto-restarts** your server when files change (no manual `Ctrl+C` + rerun). `npm install -D nodemon`, then `nodemon index.js`.

### Q: npm scripts?
```json
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js"
}
```
Run with `npm start` / `npm run dev`.

---

## 8. Node Globals & `process`

### Q: Useful global objects (no import needed)?
- `process` — info about the running process: `process.env` (env vars), `process.argv` (CLI args), `process.exit()`.
- `__dirname` / `__filename` — current directory/file path (CommonJS only; in ESM use `import.meta.url`).
- `console`, `setTimeout`, `setInterval`, `Buffer`.

### ⭐ Q: What is `process.env` and why use it?
Holds environment variables. Used for **config/secrets** (DB URLs, API keys, ports) so they're not hard-coded. Loaded from a `.env` file via the `dotenv` package.
```js
const PORT = process.env.PORT || 3000;
```
