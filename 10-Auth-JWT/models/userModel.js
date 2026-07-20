// Rule to remember: schema setup (fields, hooks, methods) → THEN mongoose.model() → THEN export.
// The model line is always the second-to-last thing.

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // name:     String, required
    name: {
      type: String,
      required: true,
    },
    // email:    String, required, unique, lowercase
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    // password: String, required, minlength 6
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  { timestamps: true },
);

// pre-save hook: hash the password before saving (only if it changed)
// On the userSchema, BEFORE a save happens, run this async function.
// ⚠️ Mongoose 7+ : an ASYNC hook does NOT receive `next`. Signal "skip" with `return`,
//    and "proceed" by simply letting the async function finish (its promise resolving).
//    (Old tutorials pass/call `next` — that's Mongoose ≤6 and throws "next is not a function" here.)
// regular function (NOT arrow) → so `this` = the document being saved
userSchema.pre("save", async function () {
  // 1. if password NOT modified → skip hashing (just return)
  if (!this.isModified("password")) return;
  // The isModified guard matters: if a user later updates just their name, the password field is already a hash
  // — without the guard you'd hash the hash, and login would break forever.

  // 2. genSalt(10) -> makes a random salt. The 10 is the COST/WORK FACTOR (2^10 = 1024 rounds),
  //    NOT the salt length — higher = slower to compute = harder to brute-force. The salt itself
  //    is always 22 chars and gets stored INSIDE the resulting hash string.
  //    Flow: receive plain password -> hash it with the salt -> store the hash in this.password.
  const salt = await bcrypt.genSalt(10); // cost factor 10 (work factor), not "10 chars"
  this.password = await bcrypt.hash(this.password, salt); // replace plain pw with its hash
  // no next() — the function ending IS the "proceed to save" signal
});

// instance method: compare a candidate password to the stored hash
// On login you'll need to check "does this password match the stored hash?"
// bcrypt can compare a plain password against a hash directly (it extracts the salt from the hash).
// Add a method to every user document:

// methods first - to compare the password
// At login, matchPassword loads that stored hash as this.password and asks bcrypt to check the entered password against it
// — comparing,never storing.
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// compile LAST, after everything is registered
const User = mongoose.model("User", userSchema);

export default User;
