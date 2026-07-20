// authRoutes.js ← maps auth endpoints → controller functions (mounted at /api/auth)

import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js"; // note: .js + authController (not application)

const router = express.Router();

router.post("/register", registerUser); // POST /api/auth/register
router.post("/login", loginUser); // POST /api/auth/login

export default router;
