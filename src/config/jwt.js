import jwt from "jsonwebtoken";

function generateToken(payload, expiresIn) {
  console.log(process.env.TOKEN_KEY);
  return jwt.sign(payload, process.env.TOKEN_KEY, { expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.TOKEN_KEY);
}
export { generateToken, verifyToken };
