// PATHS in CommonJS — __dirname and __filename ARE built in (no setup needed).
// Run: node paths-cjs.cjs
// Compare with paths-esm.js to see why ESM needs the import.meta.url workaround.

const path = require("path");

// ✅ In CommonJS these globals just exist — Node provides them automatically.
console.log("__filename:", __filename); // full path to this file
console.log("__dirname :", __dirname);  // folder this file lives in

// Same path.join, same purpose — build OS-safe paths anchored to this file.
const target = path.join(__dirname, "data", "info.txt");
console.log("safe path :", target);

// The difference is ONLY how you GET __dirname:
//   CommonJS → built-in global.
//   ESM      → must derive it: path.dirname(fileURLToPath(import.meta.url)).
