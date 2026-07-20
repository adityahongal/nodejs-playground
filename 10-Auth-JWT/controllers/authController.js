// authController.js ← auth logic: register a new user + log an existing user in

import User from "../models/userModel.js";
import { generateToken } from "../utils/generateToken.js";

// POST /api/auth/register — create a new user account
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. does a user with this email already exist? → 400 if so
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. create the user (the pre-save hook hashes the password automatically)
    const user = await User.create({ name, email, password });

    // 3. respond 201 with SELECTED fields + a fresh token (NO password!)
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login — verify credentials + issue a token
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. find the user by email (returns the user DOCUMENT, or null)
    const user = await User.findOne({ email });

    // 2. user exists AND the entered password matches the stored hash?
    //    - matchPassword is an INSTANCE method → call it on the `user` DOCUMENT
    //    - && short-circuits: if user is null, matchPassword is never called
    if (user && (await user.matchPassword(password))) {
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      // same vague message whether email is unknown OR password is wrong
      return res.status(401).json({ message: "Invalid Email/Password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
