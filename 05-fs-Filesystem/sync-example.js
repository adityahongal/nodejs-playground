// SYNCHRONOUS (BLOCKING) file operations — the ...Sync family.
// These run ON THE MAIN THREAD (call stack), NOT on libuv's thread pool.
// Node FREEZES on each line until the disk finishes — nothing else can run.
// No callback, no await, no Promise — the result is RETURNED directly.
//
// ✅ OK for one-time startup scripts (config load before server starts).
// ❌ NEVER inside a server request handler — it blocks ALL other requests.

import { writeFileSync, readFileSync, appendFileSync } from "fs";

// No async function needed — everything is blocking and returns immediately.
try {
  // 1. Write a file — blocks until fully written to disk, then returns.
  writeFileSync("sync-demo.txt", "First line (written synchronously)");
  console.log("✅ written (this log waits for the write to finish)");

  // 2. Append — blocks until done.
  appendFileSync("sync-demo.txt", "\nSecond line (appended synchronously)");

  // 3. Read — the data is RETURNED directly (no callback/await).
  //    "utf-8" → get a string; without it you'd get a raw Buffer.
  const data = readFileSync("sync-demo.txt", "utf-8");
  console.log("📖 content:\n", data);
} catch (err) {
  // Sync errors are THROWN — so try/catch is how you handle them.
  console.log("error:", err);
}

console.log("This ALWAYS prints LAST — sync code runs top-to-bottom, no deferral.");
