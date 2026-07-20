import jwt from "jsonwebtoken";

export const generateToken = (userId) => {
    return jwt.sign({id:userId}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN});
}


// jwt.sign() — minting a token
  
// jwt.sign(payload, secret, options)

// - payload = the data baked into the token. ⚠️  Only put the user's _id — never the password or anything sensitive. 
// A JWT is signed, not encrypted — anyone can decode and read the payload (paste one into jwt.io and see). 
// Signing means they can't forge it,but they can read it. So: id only.
// - secret = your process.env.JWT_SECRET — proves the token came from your server.
// - options = { expiresIn: process.env.JWT_EXPIRES_IN } (our 7d).
  
// Since we'll sign a token in both register and login ,i am making it a tiny reusable helper