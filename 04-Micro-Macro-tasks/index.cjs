// SAME code as index.js, but forced to CommonJS via the .cjs extension.
// Run BOTH and compare: `node index.js` vs `node index.cjs`.
// Difference: process.nextTick vs Promise ordering at the top level.

console.log("1 — sync (call stack, runs first)");

setTimeout(() => {
  console.log("5 — setTimeout (MACROtask)");
}, 0);

Promise.resolve().then(() => {
  console.log("4 — Promise.then (MICROtask)");
});

process.nextTick(() => {
  console.log("3 — process.nextTick (highest microtask in CJS)");
});

console.log("2 — sync");

// ✅ CommonJS = textbook order: 1, 2, 3, 4, 5
// process.nextTick (3) beats Promise (4), both beat setTimeout (5).
