// applicationModel.js ← the data
// you define a Schema, then compile it into a Model, then your controllers use the Model to talk to the DB

import mongoose from "mongoose";

// 1. The Schema - structure of the data made with mongoose
const applicationSchema = new mongoose.Schema(
  {
    company: {
        type: String,
        required: true,
      },
    role: {
        type: String,
        required: true,
      },
    status: {
        type: String,
        default: "applied",                          //default = if you don't send a status, it becomes "applied" automatically.
        enum: ["applied", "interview", "offer", "rejected", "pending"]              //enum = only these strings are allowed (typo-proofing)
      },
  },
  { timestamps: true },
);

// 2. Model (which interacts with the actual mongoDB)
const Application = mongoose.model("Application", applicationSchema);

export default Application;
