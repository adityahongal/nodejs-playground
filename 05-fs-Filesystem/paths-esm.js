// PATHS in ES Modules — __dirname does NOT exist here!
// Run: node paths-esm.js

import path from "path";
import { fileURLToPath } from "url";

// ❌ __dirname and __filename are NOT available in ES Modules.
// console.log(__dirname); // ReferenceError: __dirname is not defined

// ✅ Rebuild them from import.meta.url (the URL of THIS file).
const __filename = fileURLToPath(import.meta.url); // full path to this file
const __dirname = path.dirname(__filename);        // the folder this file lives in

console.log("__filename:", __filename);
console.log("__dirname :", __dirname);

// path.join builds a correct path for ANY OS (handles / vs \ automatically).
// Anchoring to __dirname makes it work no matter where you run `node` from.
const target = path.join(__dirname, "data", "info.txt");
console.log("safe path :", target);

// Handy path helpers:
console.log("basename  :", path.basename(target)); // "info.txt"
console.log("extname   :", path.extname(target));  // ".txt"
console.log("dirname   :", path.dirname(target));  // ".../data"
