// MVC = Model–View–Controller. It's a way to organize code by responsibility so each piece does one job.
// Instead of one giant file, you split it into layers -
// Model - the data/database
// View - the UI or react part
// Controller - the logic what to do with the data(the functions for create,delete,update,find,etc)
// Routes - maps URL + methods

//  The flow (how a request travels through the layers)
//   Request →  ROUTE (matches URL+method)  →  CONTROLLER (runs the logic)  →  MODEL (the data)

// index.js ← entry point: create app, middleware, mount routes, listen

// The key new tool: express.Router()
// To split routes into their own file, Express gives you a mini-app called a Router: in routes/applicationRoutes.js

// the chain: .env → dotenv → process.env. This line is what runs dotenv and fills process.env.MONGO_URI. 
// It must execute before connectDB() is called,or the box is still empty and you'd connect to undefined. 
// Putting it as the top line guarantees it runs first. 
import "dotenv/config";                     // always put this at the top line

import express from "express";
import applicationRoutes from "./routes/applicationRoutes.js"; // applications feature router
import authRoutes from "./routes/authRoutes.js"; // auth feature router
import connectDB from "./config/db.js"; // db config file

const app = express();
app.use(express.json()); // 1. middleware — parse JSON bodies (app-level)

// 2. mount routers — one app can host many routers at different base paths
app.use("/api/applications", applicationRoutes); // /api/applications/...
app.use("/api/auth", authRoutes); // /api/auth/register, /api/auth/login

// Add the database call
connectDB();

app.listen(3030, () => {
  console.log("API running on http://localhost:3030");
});
