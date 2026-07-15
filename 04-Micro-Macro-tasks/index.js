// EXPERIMENT (ES Module): the ORDER the event loop runs things.
// This file is ESM (repo has "type": "module"). See index.cjs for the CommonJS version
// and notice how process.nextTick vs Promise ordering DIFFERS at the top level.

console.log("1 — sync (call stack, runs first)");

setTimeout(() => {
  console.log("5 — setTimeout (MACROtask, lowest priority here)");
}, 0);

Promise.resolve().then(() => {
  console.log("? — Promise.then (MICROtask)");
});

process.nextTick(() => {
  console.log("? — process.nextTick (normally highest microtask)");
});

console.log("2 — sync (still before ANY callback)");

// ⚠️ ESM QUIRK: at the TOP LEVEL of an ES module, Promise.then drains BEFORE
// process.nextTick — so here the order is: 1, 2, Promise, nextTick, 5.
// This is the OPPOSITE of the textbook rule, and it's specific to ESM top-level.
// In index.cjs (CommonJS), the order is the textbook one: 1, 2, nextTick, Promise, 5.
