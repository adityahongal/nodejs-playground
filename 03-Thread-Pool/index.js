// EXPERIMENT: prove libuv's thread pool has 4 threads.
// Just run this and WATCH the output order. No need to memorize the code.

import crypto from "crypto";

const start = Date.now();

// A helper that does ONE slow task (heavy password hashing) on a libuv thread.
// Don't worry about the crypto details — think of it as "a slow job".
function slowJob(name) {
  crypto.pbkdf2("secret", "salt", 100000, 64, "sha512", () => {
    const seconds = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`${name} finished after ${seconds}s`);
  });
}

// Start 6 slow jobs AT THE SAME TIME.
slowJob("Job 1");
slowJob("Job 2");
slowJob("Job 3");
slowJob("Job 4");
slowJob("Job 5");
slowJob("Job 6");

console.log("All 6 jobs started. Now watch which ones finish together...");
