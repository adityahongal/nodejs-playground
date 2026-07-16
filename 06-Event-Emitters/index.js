// Event Emitters — the publish/subscribe (pub/sub) pattern.
// .on/.once = SUBSCRIBE (need a FUNCTION).  .emit = PUBLISH (fire the event, pass data).

import { EventEmitter } from "events"; // built-in module, no install

const emitter = new EventEmitter(); // create an emitter object

// 1. SUBSCRIBE — register a listener for the "greet" event.
//    NOTE: save the function in a variable if you ever want to .off() it later —
//    .off() removes a listener by its EXACT reference, so anonymous inline fns can't be removed.
const greetListener = (name) => {
  console.log(`Hello, ${name}!`);
};
emitter.on("greet", greetListener);

// 2. PUBLISH — fire the event (emit runs listeners SYNCHRONOUSLY, right now).
emitter.emit("greet", "xyz"); // → "Hello, xyz!"

// UNSUBSCRIBE — pass the SAME function reference we registered above.
emitter.off("greet", greetListener); // now "greet" has no listeners
emitter.emit("greet", "nobody");     // fires, but nothing happens (no listeners)

// ── Multiple listeners on the SAME event ──────────────────────────────
// Goal: ONE event ("userRegistered") → MANY reactions. Both listeners fire on one emit.
const userEvents = new EventEmitter();

// listener 1
userEvents.on("userRegistered", (name) => {
  console.log(`Welcome email sent to ${name}`);
});

// listener 2 — SAME event name, so a single emit triggers BOTH (in registration order)
userEvents.on("userRegistered", (name) => {
  console.log(`Admin notified: ${name} joined`);
});

// ONE emit → BOTH listeners run
userEvents.emit("userRegistered", "xyz");

// ── .once() — listener runs only the FIRST time ───────────────────────
userEvents.once("firstLogin", (name) => {
  console.log(`First login welcome shown to ${name}`);
});

userEvents.emit("firstLogin", "xyz"); // ✅ runs (first time)
userEvents.emit("firstLogin", "xyz"); // ❌ ignored — .once auto-removed the listener
