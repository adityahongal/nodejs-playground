// EXPERIMENT: does it matter whether nextTick/Promise are at TOP-LEVEL vs INSIDE a callback?
// Answer (ESM): YES — only the top level flips. Inside a callback, textbook order returns.
// (In CommonJS both are textbook. Copy to .cjs and run to confirm.)

// --- TOP-LEVEL (global module scope) ---
process.nextTick(() => console.log("top-level: nextTick"));
Promise.resolve().then(() => console.log("top-level: promise"));

// --- INSIDE a callback (not top-level) ---
setTimeout(() => {
  console.log("--- now inside a setTimeout callback ---");
  process.nextTick(() => console.log("inside: nextTick"));
  Promise.resolve().then(() => console.log("inside: promise"));
}, 10);

// ESM output:
//   top-level: promise      <- flipped (ESM top-level quirk)
//   top-level: nextTick
//   --- now inside a setTimeout callback ---
//   inside: nextTick        <- textbook (nextTick wins inside callbacks)
//   inside: promise
