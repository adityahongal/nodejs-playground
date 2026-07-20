// this is authentication — "are you logged in?" (valid token or not)

import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. if there's an Authorization header AND it starts with "Bearer" → extract the token
    if ( req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      // token = ... (split on space, take index [1])
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. no token → 401 "Not authorized, no token"
    if (!token) {
      return res.status(401).json({ message: "Not Authorised to do this" });
    }

    // 3. verify the token → decoded payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. find the user by decoded.id, exclude password, attach to req.user
    req.user = await User.findById(decoded.id).select("-password");

    //if a user account gets deleted and token is present, user tries to login the token gets verified
    //but search for user id returns null and would crash so we add the below guard
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, user no longer exists" });
    }

    // 5. let the request continue
    next();
  } catch (error) {
    // any failure (bad/expired token) → 401 "Not authorized, token failed"
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};
