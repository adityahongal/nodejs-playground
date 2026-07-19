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

## 3b. libuv, V8 & the Thread Pool (⭐ deep-dive, common)

### ⭐ Q: What is libuv?
A **C library** bundled inside Node that gives Node its async powers. It provides:
1. **The event loop** — juggles many operations on one thread.
2. **A thread pool (default 4 threads)** — runs operations the OS can't do async natively (mainly `fs` file system + `crypto` + DNS) on background threads, so the main thread stays free.

### ⭐ Q: Difference between V8 and libuv?
| | **V8** | **libuv** |
|---|---|---|
| Language | C++ | C |
| Job | **Runs your JavaScript** (compiles JS → machine code) | **Async I/O + event loop** (timers, fs, network) |
| Analogy | The **brain** (understands JS) | The **hands** (talks to OS/disk/network) |

**One-liner:** *"V8 executes the JavaScript; libuv provides the non-blocking, event-driven I/O via the event loop and a thread pool. Node = V8 + libuv + Node's own APIs."*

### ⭐ Q: How does the event loop actually work? (call stack ↔ libuv ↔ queue)
```
CALL STACK (V8 runs JS, one thing at a time)
   │ hits async op (setTimeout, fs.readFile, crypto)
   ▼
libuv runs it in the BACKGROUND (timer via OS, or fs/crypto via thread pool)
   │ when done, pushes the callback into...
   ▼
CALLBACK QUEUE (waiting line)
   ▲
EVENT LOOP: "is the call stack EMPTY? → move next callback onto the stack and run it"
```
**Golden rule:** a queued callback only runs when the **call stack is empty** (all synchronous code finished). This one rule explains async ordering.

### Q: Trace — why does `4, 2, 3, 1` print from `func4(); func1(); func2(); func3();`?
```js
func4(); // fs.writeFileSync + log  → BLOCKING, runs fully on the stack → prints "4" first
func1(); // setTimeout(cb, 2000)    → hands timer to libuv, returns immediately → prints nothing yet
func2(); // log                     → prints "2"
func3(); // log                     → prints "3"
// stack now EMPTY. 2s later, libuv queues func1's cb → event loop runs it → prints "1" LAST
```

### ⭐ Q: The thread pool — how do you PROVE it has 4 threads?
Fire 6 heavy `crypto.pbkdf2` jobs at once and time them:
```js
import crypto from "crypto";
const start = Date.now();
function slowJob(name) {
  crypto.pbkdf2("secret", "salt", 100000, 64, "sha512", () => {
    console.log(`${name} done after ${((Date.now()-start)/1000).toFixed(1)}s`);
  });
}
for (let i = 1; i <= 6; i++) slowJob(`Job ${i}`);
```
**Result:** first **4 jobs finish together**, then **jobs 5 & 6 finish in a second wave** — because only 4 threads exist, so the extras wait their turn.
- `UV_THREADPOOL_SIZE=2 node index.js` → jobs finish **2 at a time** (waves of 2).
- `UV_THREADPOOL_SIZE=6 node index.js` → all **6 finish together**.

Proof: jobs started at the same instant finish in **waves the size of the pool**, and resizing the pool resizes the waves.

### ⚠️ Note: timers vs thread pool
`setTimeout`/network use the OS directly (NOT the thread pool). Only **`fs`, `crypto`, DNS** use the thread pool. So to demo the pool, use `crypto`/`fs`, not `setTimeout`.

### ⭐ Q: Browser event loop vs Node event loop — what's the difference?
Same *concept*, different *background machinery*:
```
Browser:  Call Stack → Web APIs (background) → Callback Queue → Event Loop → Stack
Node:     Call Stack → libuv    (background) → Callback Queue → Event Loop → Stack
                       ▲ only this box differs
```
| | Browser | Node |
|---|---|---|
| Background crew | **Web APIs** (browser feature, C++) | **libuv** (C library) |
| Async examples | setTimeout, fetch, DOM events | timers, fs, network, crypto |
| Thread pool for files? | ❌ no file system | ✅ libuv thread pool |
| Extra concerns | rendering, requestAnimationFrame | none (no UI) |

**libuv is Node's version of the browser's Web APIs.** When you did `setTimeout`/`fetch().then()` in React, the browser offloaded + queued the callback exactly like libuv does in Node.
*(Both also have a higher-priority **microtask queue** for Promises/`await` that runs before the normal callback queue.)*

---

## 3c. Microtasks vs Macrotasks & `process.nextTick` (⭐ top interview topic)

### ⭐ Q: What are microtasks and macrotasks?
Two separate callback queues. **Microtasks have priority** — after each macrotask, the event loop drains the ENTIRE microtask queue before the next macrotask. Microtasks "jump the line."

### ⭐ Q: What goes in each queue?
**Node.js — priority order (high → low):**
1. **Synchronous code** (call stack) — always first
2. **Microtasks:** `process.nextTick()` (highest), then Promises (`.then`/`await`/`queueMicrotask`)
3. **Macrotasks (in phases):** Timers (`setTimeout`/`setInterval`) → Poll (I/O callbacks: fs, network) → Check (`setImmediate`) → Close events

**Browser — priority order:**
1. Synchronous code
2. **Microtasks:** Promises, `queueMicrotask`, `MutationObserver` (NO `process.nextTick` — Node-only)
3. **Macrotasks:** `setTimeout`/`setInterval`, I/O, UI events, `MessageChannel`
4. **Render** (paint the screen — Node has none). `requestAnimationFrame` runs just before paint.

| | Node.js | Browser |
|---|---|---|
| Highest microtask | `process.nextTick` | (none — starts at Promises) |
| Microtasks | Promises, queueMicrotask | Promises, queueMicrotask, MutationObserver |
| Macrotasks | setTimeout, I/O, **setImmediate**, close | setTimeout, I/O, UI events, MessageChannel |
| Extras | event-loop phases | requestAnimationFrame + rendering |

### ⭐ Q: What does this print?
```js
console.log("1");
setTimeout(() => console.log("2"), 0);        // macrotask
Promise.resolve().then(() => console.log("3")); // microtask
console.log("4");
// Output: 1, 4, 3, 2  (sync first, then microtask Promise, then macrotask timer)
```

### Q: What is `process.nextTick`?
- Node-only (`process` is a Node global; browser has no `process`).
- `process.nextTick(cb)` = "run cb immediately after the current operation, before the event loop moves on to Promises/timers/I/O." Normally the **highest-priority** microtask.
- **Purpose:** run something right after current code but still async; let an object finish setup before emitting an event.
- ⚠️ Rarely needed as a beginner. Overuse can **starve** the event loop (endless nextTicks block timers/I/O). Prefer Promises/`setImmediate`.

### ⚠️ GOTCHA: ESM top-level flips nextTick vs Promise (found by experiment!)
Same code, different result depending on module system AND scope:
| Where | ES Module (`.mjs`/`"type":"module"`) | CommonJS (`.cjs`) |
|---|---|---|
| **Top-level (global)** | Promise → nextTick (**flipped!**) | nextTick → Promise ✅ |
| **Inside a callback** | nextTick → Promise ✅ | nextTick → Promise ✅ |

- **Why:** ESM top-level code is evaluated inside a promise-based module loader, so top-level Promise callbacks drain before the nextTick queue. Inside any function/callback, textbook order returns.
- **Lesson:** never write code that depends on the razor-thin nextTick-vs-Promise ordering — it's fragile. (Another reason to avoid `process.nextTick`.)
- Proof: see `04-Micro-Macro-tasks/` (`index.js` ESM vs `index.cjs`, and `nexttick-scope.js`).

### ⭐ Q: Real-world use — `process.nextTick` vs Promises? (+ call-stack view)
Both are microtasks (run after the stack empties, before macrotasks). Difference is *what you use them for*:

| | `process.nextTick` | Promises / `async-await` |
|---|---|---|
| Real use | Library internals — "let the caller finish setup / attach listeners before I emit" | Real async work: DB, API, file reads |
| You'll use it? | Rarely (mostly library authors) | **Constantly** (every app) |
| Priority | Highest microtask (before Promises) | After nextTick |
| Call stack | Runs after stack empties, ahead of Promises | Function **leaves** the stack at `await`, resumes later as a microtask |

**nextTick use case** — emit an event only after the caller can attach a listener:
```js
function connect() {
  const conn = new EventEmitter();
  process.nextTick(() => conn.emit("ready")); // defer: caller's .on() runs first
  return conn;
}
const c = connect();
c.on("ready", () => console.log("connected!")); // attached AFTER connect() returns → still caught
// Emitting synchronously would fire before .on() exists → event MISSED.
```

**Promise use case** — do slow I/O without blocking, then continue:
```js
async function getDashboard(id) {
  const user = await db.findUser(id);      // function leaves the stack while waiting
  const orders = await api.getOrders(id);  // resumes as a microtask when result arrives
  return { user, orders };
}
```
**Call-stack insight:** at `await`, the async function pops OFF the stack (thread is free for other work); when the awaited result is ready, the code *after* `await` is queued as a microtask and put back on the stack. That's *why* Promises are non-blocking.

**Takeaway:** `nextTick` = niche timing control (rarely needed). Promises/`await` = your everyday tool for every DB/API/file call.

### Q: `setImmediate` vs `setTimeout(fn, 0)`?
Both Node-only-ish macrotasks. `setImmediate` runs in the **Check** phase (after I/O/poll); `setTimeout(fn,0)` runs in the **Timers** phase. Inside an I/O callback, `setImmediate` reliably fires first.

---

## 4. Modules: CommonJS vs ES Modules (⭐ often missed, often asked)

> 🎯 **My strategy:** WRITE in ES Modules (modern standard, pairs with React). Know CommonJS
> only at **read & recognize** level — you'll constantly *read* it in existing codebases, npm
> packages, and older tutorials, and the difference is a common interview question. Don't invest
> in writing CJS fluently.

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

### ⭐ Q: How does Node decide CommonJS vs ESM? (recognize-level)
- **File extension wins:** `.cjs` = always CommonJS, `.mjs` = always ESM.
- **`.js` files:** follow the nearest `package.json`'s `"type"` field (`"module"` = ESM, absent/`"commonjs"` = CJS).
- Common error to recognize: **`require is not defined in ES module scope`** → you used `require` in a file Node is treating as ESM. Fix: use `import`, or rename the file `.cjs`.

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

### Q: What is the REPL?
**REPL = Read–Eval–Print–Loop** — the interactive Node prompt. Type `node` (no filename) → get `>` → run JS live. Lifecycle = the loop: Read input → Evaluate → Print result → Loop. Great for testing snippets. `.exit` or Ctrl+C twice to quit. (Browser console is basically a REPL.)

### Q: What is the `os` module?
Built-in module for info about the machine/OS Node runs on.
```js
import os from "os";
os.platform();        // "darwin" | "win32" | "linux"
os.cpus().length;     // number of CPU cores (used to size worker pools)
os.totalmem();        // total RAM (bytes)
os.homedir();         // "/Users/adityahongal"
```

---

## 9. File System (`fs`) module (⭐ core)

### ⭐ Q: What is `fs`? Which "engine" runs it?
Built-in module (no install) to read/write/manage files & folders. It's the classic **thread-pool** I/O — async `fs` work runs on one of libuv's 4 background threads.

### ⭐ Q: The 3 flavors of every `fs` operation?
```js
// 1. CALLBACK (original) — error-first callback
import fs from "fs";
fs.readFile("f.txt", "utf-8", (err, data) => { if (err) return; console.log(data); });

// 2. PROMISE (MODERN — use this) — clean with async/await
import fs from "fs/promises";
const data = await fs.readFile("f.txt", "utf-8");

// 3. SYNC — BLOCKS the main thread; result RETURNED directly; errors THROWN
import fs from "fs";
const data = fs.readFileSync("f.txt", "utf-8");
```
**Rule:** apps use `fs/promises` + `await`. Sync only for one-time startup scripts, NEVER in a request handler (blocks all requests).

### Q: Common operations (promise style)
```js
import fs from "fs/promises";
await fs.writeFile("f.txt", "hi");        // create/OVERWRITE whole file
await fs.appendFile("f.txt", "\nmore");   // add to end (keeps existing)
await fs.readFile("f.txt", "utf-8");      // read → string
await fs.rename("f.txt", "g.txt");        // rename/move
await fs.unlink("g.txt");                 // DELETE a file ("unlink")
await fs.mkdir("logs", { recursive: true }); // make folder; recursive = no crash if exists
await fs.readdir(".");                    // list folder → array of names
await fs.stat("g.txt");                   // info: .size, .birthtime, etc.
```

### ⭐ Q: How does async `fs` + `await` work in the event loop / call stack?
Each `await fs.x()`:
1. hands the disk work to **libuv's thread pool** (background thread),
2. your `async` function **pops OFF the call stack** — the main thread is FREE (not frozen),
3. when the disk finishes, the "continue after await" is queued as a **microtask** and put back on the stack.

`await` runs steps **in order** (write finishes before read starts) WITHOUT blocking — that's why it beats `...Sync`:
| | `fs/promises` + await | `readFileSync` |
|---|---|---|
| Disk work runs on | libuv thread pool (bg) | main thread (call stack) |
| Main thread while waiting | FREE — serves others | FROZEN |
| Server impact | ✅ responsive | ❌ blocks all requests |

### Q: Sequential vs parallel file ops?
```js
await readFile("a"); await readFile("b");            // sequential: total = sum
await Promise.all([readFile("a"), readFile("b")]);   // parallel: total = slowest (use when order doesn't matter)
```
Dependent steps (rename after write) → sequential `await`. Independent reads → `Promise.all`.

### ⚠️ CAVEATS (don't-skip)
- **`writeFile` OVERWRITES** the whole file — use `appendFile` to add. Beginners lose data here.
- **Encoding:** without `"utf-8"` you get a raw **Buffer** (binary bytes), not a string. A Buffer = Node's way to hold raw binary (files aren't always text — images/video/zip are binary).
- **Paths are relative to where you RUN `node`**, not where the file lives → anchor paths to the file (see below).
- **ESM has no `__dirname`/`__filename`** — rebuild them:
  ```js
  import path from "path"; import { fileURLToPath } from "url";
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const file = path.join(__dirname, "data.txt"); // reliable path
  ```
  (CommonJS has `__dirname`/`__filename` built in.)

### ⭐ Q: Error-handling patterns?
```js
// callback → error-first arg
readFile("x", (err, data) => { if (err) return console.error(err); });
// promise/sync → try/catch, then inspect err.code
try { await readFile("x", "utf-8"); }
catch (err) { if (err.code === "ENOENT") console.log("not found"); else throw err; }
```
Common codes: **`ENOENT`** (no such file — #1 error), `EACCES` (no permission), `EEXIST` (already exists).

### ⭐ Q: Race conditions with files? (interview-worthy)
A race condition = two ops run "at the same time" and the result depends on which finishes first → unpredictable. Classic **check-then-act** bug:
```js
// ❌ file could be created BETWEEN the check and the write
if (!existsSync("f.txt")) await writeFile("f.txt", "x");
// ✅ act atomically, handle the error instead of checking first
try { await writeFile("f.txt", "x", { flag: "wx" }); } // "wx" = fail if exists
catch (err) { if (err.code === "EEXIST") console.log("already exists"); }
```
Also: many concurrent `appendFile`s to the SAME file can interleave/corrupt — use sequential `await` or a queue. Lesson: with concurrent I/O, don't assume order; make each op self-contained.

### Q: `fs.watch()`?
Watches a file/folder for changes and fires a callback on edit/rename/delete. Keeps the process alive (like a server). This is how **nodemon** auto-restarts. Rarely written directly.
```js
import { watch } from "fs";
watch("myFolder", (eventType, filename) => console.log(eventType, filename));
```

---

## 10. Event Emitters (⭐ core pattern)

### ⭐ Q: What is an Event Emitter?
An object implementing the **publish/subscribe (pub/sub)** pattern: you **`emit`** named events (publish) and **`on`** listen for them (subscribe). Same idea as browser `addEventListener`, but for your own custom events. Node's core objects ARE emitters (`server.on("request")`, `stream.on("data")`, `process.on("exit")`).

### ⭐ Q: Basic syntax?
```js
import { EventEmitter } from "events"; // built-in, no install
const emitter = new EventEmitter();

emitter.on("greet", (name) => console.log(`Hello, ${name}!`)); // SUBSCRIBE
emitter.emit("greet", "Aditya");                               // PUBLISH → "Hello, Aditya!"
```

### Q: Key methods
```js
emitter.on("e", fn);       // subscribe — runs EVERY time e fires
emitter.once("e", fn);     // subscribe — runs ONLY the first time (auto-removes after)
emitter.emit("e", data);   // fire the event, pass data to listeners
emitter.off("e", fn);      // unsubscribe (needs the SAME fn reference)
emitter.listenerCount("e");// how many listeners
```

### ⭐ Q: Multiple listeners on one event?
Register many listeners on the **same event name** → one `emit` runs them **all, in registration order**. That's the point of pub/sub: one event → many reactions.
```js
bus.on("userRegistered", (n) => console.log(`Welcome email to ${n}`));
bus.on("userRegistered", (n) => console.log(`Admin notified: ${n}`));
bus.emit("userRegistered", "xyz"); // BOTH run
```

### ⚠️ GOTCHAS (I hit all three)
1. **`.on`/`.once` need a FUNCTION; `.emit` takes DATA.** Don't confuse subscribing with firing. `once("e", "xyz")` → `TypeError: listener must be a function`.
2. **`.off` needs the EXACT same function reference** — inline anonymous functions can't be removed. Save the listener in a variable to remove it later.
3. **Different event names ≠ multiple listeners.** For "many reactions to one event," all listeners must use the **same** event name.

### ⭐ Q: Is `emit` sync or async?
**Synchronous** — listeners run immediately on the call stack (not deferred like setTimeout). Also: the **listener must be registered BEFORE `emit`**, or the event is missed. (This is why libraries defer emits with `process.nextTick` — see §3c.)

---

## 11. Express & REST APIs (⭐ core — this is the job)

### ⭐ Q: What is a REST API?
An architectural **style** (not a protocol) for designing web APIs. Rules: expose **resources** via URLs (nouns), act on them with **HTTP methods** (verbs), be **stateless**, use **JSON** + proper **status codes**.
- Resource URLs use nouns: `GET /users/5` ✅, not `GET /getUser?id=5` ❌.
- The URL names the *thing*; the method says what to *do*.
- **Stateless** = each request carries everything the server needs (e.g. auth token); server stores no session between requests → scalable.

### ⭐ Q: What is Express? Why use it over raw `http`?
A minimal web framework on top of Node's `http`. Gives clean **routing**, **middleware**, and helpers (`res.json`, `req.params`, `req.body`) — no manual `req.url` branching or `res.end` juggling.
```js
import express from "express";
const app = express();
app.get("/path", (req, res) => res.json({ ok: true }));
app.listen(3000, () => console.log("up"));
```

### ⭐ Q: What is middleware?
A function that runs **between** the request arriving and your route handler — it can read/modify `req`/`res`, then call `next()` to pass control on.
```
Request → [middleware] → [middleware] → route handler → Response
```
`app.use(fn)` runs `fn` for all routes. Examples: body parsing, auth checks, logging, CORS.

### ⭐ Q: Why `app.use(express.json())`?
Built-in middleware that reads the incoming JSON **string** body and `JSON.parse()`s it onto **`req.body`**. Without it, `req.body` is `undefined` on POST/PUT (the #1 beginner bug).

### ⭐ Q: How does JSON.parse/stringify relate to Express?
HTTP only sends **text (strings)**. Express converts for you:
| Direction | Raw way | Express way |
|---|---|---|
| Incoming | `JSON.parse(body)` | `express.json()` → `req.body` |
| Outgoing | `res.end(JSON.stringify(obj))` | `res.json(obj)` |

### ⭐ Q: Route params vs body?
- **Route param** `:id` → `req.params.id` (from the URL, always a **string** → `Number(...)` to compare).
- **Body** → `req.body` (the JSON the client sent, parsed by `express.json()`).

### ⭐ Q: `res.status()` vs `res.json()`/`res.send()`?
- `res.status(code)` — sets the status code ONLY (sends nothing); returns `res` so you can chain.
- `res.json(obj)` — sends JSON body (default 200). `res.send()` — sends text/html/etc.
- Combine: `res.status(201).json(newItem)`.

### The 5 CRUD endpoints (the pattern)
```js
app.use(express.json());
let items = [ /* in-memory array — resets on restart! */ ];

app.get("/api/items", (req, res) => res.json(items));                 // list → 200

app.get("/api/items/:id", (req, res) => {                             // one → 200/404
  const item = items.find(x => x.id === Number(req.params.id));
  if (!item) return res.status(404).json({ message: "not found" });
  res.json(item);
});

app.post("/api/items", (req, res) => {                                // create → 201
  const item = { id: items.length + 1, ...req.body };
  items.push(item);
  res.status(201).json(item);
});

app.put("/api/items/:id", (req, res) => {                             // update → 200/404
  const item = items.find(x => x.id === Number(req.params.id));
  if (!item) return res.status(404).json({ message: "not found" });
  item.name = req.body.name || item.name;   // keep old if not provided
  res.json(item);
});

app.delete("/api/items/:id", (req, res) => {                          // delete → 204/404
  const exists = items.find(x => x.id === Number(req.params.id));
  if (!exists) return res.status(404).json({ message: "not found" });
  items = items.filter(x => x.id !== Number(req.params.id));
  res.status(204).send();
});
```

### ⚠️ CAVEATS (I hit these)
- **One response per request.** `res.json/send/end` all END the response — call one, once. A second send → `ERR_HTTP_HEADERS_SENT`.
- **Guard clauses MUST `return`** — `if (!found) return res.status(404)...` — else the code below runs and sends a 2nd response (crash).
- **`req.params.id` is a string** — convert with `Number()`.
- **In-memory arrays are temporary** — wiped on restart. Real persistence = a database (MongoDB next).

### Status codes for CRUD
`200` OK (get/update) · `201` Created (post) · `204` No Content (delete) · `404` Not Found · `400` Bad Request · `500` Server Error.

### Testing (see `07-REST-API/README.md` for full curl commands)
GET → browser or curl. POST/PUT/DELETE → curl with `-X METHOD -H "Content-Type: application/json" -d '{...}'`, or Postman / VS Code REST Client.

### ⭐ Q: What is CORS? (deferred coding until React connects)
**Cross-Origin Resource Sharing** — a **browser** security mechanism controlling whether a page from one **origin** can call an API on a different origin. Origin = protocol + domain + **port** (so `localhost:3000` → `localhost:3030` is cross-origin). By default the browser's **Same-Origin Policy** blocks cross-origin requests unless the server allows them via CORS headers.
- 🔴 **Only the browser enforces CORS.** `curl`/Postman/server-to-server have NO CORS — that's why curl tests never hit it.
- **The error** (browser console): `blocked by CORS policy: No 'Access-Control-Allow-Origin' header`. Means: server didn't say your origin is allowed.
- **Behind the scenes:** server sends `Access-Control-Allow-Origin: <origin>` header. Non-simple requests (PUT/DELETE, JSON POST) trigger a **preflight**: browser auto-sends an `OPTIONS` request first to ask permission, then sends the real request only if approved.
- **Fix (Express):** `import cors from "cors"; app.use(cors());` (or `cors({ origin: "http://localhost:3000" })`) — it's middleware that adds the headers + handles preflight.
- **Interview traps:** browser enforces / server configures; Postman works because it's not a browser; preflight = the `OPTIONS` check; CORS protects the **user**, not the server.

---

## 12. MVC Structure in Express (⭐ how real apps are organized)

### ⭐ Q: What is MVC?
A way to organize code by **responsibility** so each file has one job. Layers:
- **Model** — the data + how to access it (an array now → a Mongoose model later)
- **View** — the UI (in a REST API this is just JSON / the React frontend)
- **Controller** — the logic: what to do with data (find/create/update/delete functions)
- **Routes** (Express addition) — map HTTP method + URL → controller function

**Flow:** `Request → Route → Controller → Model → (controller sends response back)`

### Q: Why MVC? (interview answer)
Separation of concerns → easier to read/test/change; scales (50 routes stay manageable); reusable logic; team-friendly. `index.js` becomes tiny (setup only).

### Q: Folder structure
```
models/applicationModel.js        // the data
controllers/applicationController.js  // export const getAll = (req,res)=>{...}  (the logic)
routes/applicationRoutes.js       // router.get("/", getAll) ...
index.js                          // create app, middleware, MOUNT routes, listen
```

### ⭐ Q: What is `express.Router()` and "mounting"?
`express.Router()` = a mini-app holding routes in their own file. Routes use paths **relative to the mount point** (`/`, `/:id` — NOT the full path).
```js
// routes file — pass the function REFERENCE (no parentheses)
const router = express.Router();
router.get("/", getAllApplications);
router.get("/:id", getApplicationById);
export default router;

// index.js — MOUNT it at a base path
app.use(express.json());                          // middleware lives at app level
app.use("/api/applications", router);             // router path "/" → GET /api/applications
```
**Mounting** = attaching the router at a base path; that prefix is prepended to every router path. Base path written **once** → change it in one place. (A router is just middleware that contains routes.)

### ⚠️ CAVEAT: mutate vs reassign shared data across modules (why DELETE uses `.splice`, not `.filter`)
When the model does `export default applications` and a controller imports it, **both point to the SAME array** (same address in memory).
- **Mutating** (`.push()`, `.splice()`) changes that shared array → visible everywhere. ✅
- **Reassigning** (`applications = applications.filter(...)`) makes a NEW array and points only the local variable at it → the model still points to the old one, out of sync. ❌ AND imported bindings are **read-only** in ESM → `applications = ...` throws `Assignment to constant variable`.
- **So DELETE uses `findIndex` + `splice` (mutate in place):**
  ```js
  const index = applications.findIndex(x => x.id === id);  // -1 if not found
  if (index === -1) return res.status(404).json({ message: "not found" });
  applications.splice(index, 1);   // MUTATES the shared array — works across files
  ```
- Rule: **across modules, mutate shared data — don't reassign it.** (This whole problem disappears with a real DB — MongoDB owns the data, not a JS variable.)

### Note: ESM import paths
Relative imports need `./` or `../` AND the **`.js` extension** (`"../models/applicationModel.js"`). CommonJS auto-adds `.js`; ESM does not → `Cannot find module` if omitted.

---

## 13. MongoDB + Mongoose (⭐ making data persist) — `09-MongoDB-Mongoose`

The in-memory array (`08`) reset on every restart. Swapped it for **MongoDB** (a cloud database) so data survives. `08` = in-memory version, `09` = persistent version (same API, different data layer).

### ⭐ Q: SQL vs NoSQL? (and where Mongo/Postgres fit)
- **SQL / relational** (PostgreSQL, MySQL, SQLite): data in **tables** (rows/columns), rigid **schema** defined up front, tables linked by IDs, stitched with **JOINs**, queried in **SQL**. Great when data is relational + correctness is critical (banking).
- **NoSQL / document** (MongoDB): data as flexible **JSON-like documents**, no rigid schema, related data **nested** inside one doc. Great when data is document-shaped + evolving.
- **SQL is a *language*, not a database.** SQLite = a SQL DB that's just a single file (no server).

### ⭐ Q: Why MongoDB for this project?
1. It's the **M in MERN** (my portfolio/interview goal).
2. Documents **are** JSON → maps 1:1 to my JS objects, no table/JOIN translation.
3. Flexible while the schema is still changing.
4. **Atlas** free tier = cloud-hosted, no local install.
- **Senior answer:** *"It depends on data shape + access pattern. For relational, transaction-heavy data I'd pick Postgres; for document-shaped, evolving data, Mongo. Here it's a MERN app with document-shaped job applications, so Mongo."* (Nuance: Postgres now has JSONB, Mongo now has transactions — the old "fast vs safe" framing is outdated.)

### ⭐ Q: What is Mongoose? (vs MongoDB)
- **MongoDB** = the database (the warehouse). It's schema-*less* — will store any junk.
- **Mongoose** = an npm library between my code and Mongo (the front-desk clerk). Adds back **Schemas** (enforce a shape), **validation**, and clean methods (`.find()`, `.create()`).
- Stack: **Express → Mongoose → MongoDB**.

### ⭐ Q: Schema vs Model? (the key distinction)
- **Schema = the blueprint / description.** Inert. Just describes fields, types, rules. Can't touch the DB — there's no `schema.find()`.
- **Model = a live, DB-connected tool built from the schema.** *This* is what has `.find()`, `.create()`, etc.
- `mongoose.model("Application", schema)` is a **factory**: hand it a schema → get back a Model (like a JS class). Analogy: Schema = form template, Model = the clerk who owns the filing cabinet.
```js
const applicationSchema = new mongoose.Schema({
  company: { type: String, required: true },
  role:    { type: String, required: true },
  status:  { type: String, enum: ["applied","interview","offer","rejected","pending"], default: "applied" },
}, { timestamps: true });          // auto createdAt + updatedAt on every doc

const Application = mongoose.model("Application", applicationSchema);
export default Application;
```
- **Schema options:** `required` (reject save if missing), `enum` (only these values — typo-proof), `default` (auto-fill), `{ timestamps: true }` (free `createdAt`/`updatedAt`).
- **`mongoose.model("Application", ...)`** → Mongoose **lowercases + pluralizes** the name → documents live in the **`applications`** collection. Model name is Capitalized + singular; the string decides the collection, the variable is my handle.
- **No manual `id`!** Mongo auto-generates a unique **`_id`** (an ObjectId, a *string* not a number) on every doc.

### Environment variables (secrets)
- **Never hardcode the DB password in code** — bots scrape GitHub and hijack DBs in minutes.
- Secrets live in a **git-ignored `.env`** file; code reads them via `process.env.X`.
- **`process.env`** = an object on the global `process` of all environment variables. My `MONGO_URI` isn't there by default — **dotenv** reads `.env` and injects it. Chain: `.env → dotenv → process.env → code`.
- `import "dotenv/config"` must be the **first import** (must run before anything reads `process.env`).
- **`process.exit(1)`** = kill the program now; the number is the **exit code** (`0` = success, non-zero = error) that tools (CI/Docker/deploy) read. Exit on DB-connect failure → **fail fast, fail loud** instead of limping.

### The connection
```js
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);   // network I/O → await
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);          // DB unreachable → API is useless → crash on startup
  }
};
```
- Connection string: `mongodb+srv://user:PASS@host/DBNAME?retryWrites=true&w=majority`. The **`/DBNAME`** (`jobtracker`) names the DB; without it you land in `test`.
- Mongoose v9: **no** `useNewUrlParser`/`useUnifiedTopology` (removed years ago — ignore old tutorials).

### ⭐ Q: Why does "server running" print BEFORE "MongoDB connected"?
`connectDB()` is called first but I **don't `await`** it → it hits `await mongoose.connect` (slow *network* I/O), **leaves the call stack**, returns a pending promise immediately. Code continues to `app.listen()` — binding a **local** port is fast → prints first. ~100ms later Atlas replies, `connectDB` **resumes as a microtask** → prints second.
- **Lesson:** calling an async fn doesn't pause your code — code *order* ≠ completion *order* once async I/O is involved. (Same truth as `setTimeout`/thread-pool experiments.)
- To force DB-first: `connectDB().then(() => app.listen(...))`.

### Controllers: array ops → Model methods (all async now)
Every controller is now **`async` + `try/catch` + `await Application.method()`** (there's a network round-trip).
| Op | OLD (array) | NEW (Model) |
|----|-------------|-------------|
| getAll | `applications` | `await Application.find()` |
| getById | `.find(x=>x.id===id)` | `await Application.findById(req.params.id)` |
| create | `.push()` | `await Application.create(req.body)` |
| update | find + reassign fields | `await Application.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })` |
| delete | `.findIndex` + `.splice` | `await Application.findByIdAndDelete(req.params.id)` |
- **`findByIdAndUpdate` options:** `new: true` → return the **updated** doc (default returns the *stale* one — classic gotcha); `runValidators: true` → re-check schema rules on update (skipped by default).
- **Pass `req.params.id` as-is** — do NOT `Number()` it; Mongo `_id`s are ObjectId strings, not numbers.
- **`create(req.body)`** — no manual object-building, no manual `id`; Mongoose validates + generates `_id`.

### ⭐ Q: Where does 404 belong? (404 vs 500 vs the catch)
- **`catch` = *unexpected failures*** (DB down, bad data) → **500** (server error).
- **"Not found" is NOT an error.** A query for a missing id **succeeds and returns `null`** — never throws, never reaches `catch`. So 404 lives in an explicit **null-guard**, not the catch:
```js
const application = await Application.findById(req.params.id);
if (!application) {
  return res.status(404).json({ message: "application not found" });  // ← 404 HERE (query worked, found nothing)
}
res.json(application);
// catch → res.status(500)   (something actually broke)
```

### ⚠️ CAVEATS (I hit these)
- **Guard clauses must `return`** — else after the 404 response, code continues to `res.json()` → sends a 2nd response → `ERR_HTTP_HEADERS_SENT`. (Same lesson from `07`.)
- **Match the catch param name** — `catch (error) { ... err.message }` → `err` is undefined → ReferenceError inside the catch. Keep `error`/`error` consistent.
- **`id` is undefined** if you forget `req.params.` — use `req.params.id`, not a bare `id`.
- **A promise signals failure by *throwing*, not by returning falsy** — so `if(!result)` after `await` doesn't catch DB errors; that's what `try/catch` is for. `if(!result)` only catches the legit "found nothing / null" case.
- **`EADDRINUSE`** — old server still on port 3030. Kill it: `lsof -ti :3030 | xargs kill -9`.

### Persistence proof (the whole point)
Create docs → `Ctrl+C` the server → restart → `GET all` → **data still there.** With `08`'s array, restart wiped everything. Now MongoDB owns the data, not a JS variable. Verified: schema validation rejects a doc missing `role` (`Application validation failed: role: Path 'role' is required`), 404 guards fire, `204` on delete, `_id`/`status` default/`timestamps` all auto-populate. Data visible in **Atlas → Browse Collections → `jobtracker` → `applications`**.