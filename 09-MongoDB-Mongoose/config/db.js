// db.js ← connects the app to MongoDB Atlas (the ONLY place we open the DB connection)

import mongoose from "mongoose";

const connectDB = async () => {
    try {
        // connecting is network I/O → async + await. Reads the secret from process.env
        // (dotenv loaded it from the git-ignored .env), so the password never sits in code.
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");
    } catch (err) {
        // DB unreachable → the whole API is useless → crash on startup (fail fast, fail loud)
        console.error(err.message);
        process.exit(1); // exit code 1 = "quit due to error" (0 = success); tools/CI read this
    }
};

export default connectDB;