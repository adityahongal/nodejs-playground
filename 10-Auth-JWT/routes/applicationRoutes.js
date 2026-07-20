// applicationRoutes.js ← maps HTTP method + path → controller function

// The key new tool: express.Router()
// To split routes into their own file, Express gives you a mini-app called a Router: in routes/applicationRoutes.js

import express from "express";
import {
  getAllApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
} from "../controllers/applicationController.js"; // ensure .js is included else module not found error
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router(); // a mini Express app for routes

router.use(protect);   // ← every application route below now requires a valid token - no application endpoint works without logging in

// map method + path → controller function (NO (req,res) here — just pass the function reference)
router.get("/", getAllApplications);                    // note: path is "/" not "/api/applications"
router.get("/:id", getApplicationById);
router.post("/", createApplication);
router.put("/:id", updateApplication);
router.delete("/:id", deleteApplication);

export default router;
