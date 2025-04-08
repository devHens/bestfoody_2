import jwt from "jsonwebtoken";

function generateToken(userId, secretKey, expiresIn = "100d") {
  if (!userId || !secretKey) {
    throw new Error("User ID and secret key are required to generate a token");
  }
  return jwt.sign({ _id: userId }, secretKey, { expiresIn });
}

function verifyToken(token, secretKey) {
  try {
    const decoded = jwt.verify(token, secretKey);
    return { valid: true, payload: decoded };
  } catch (err) {
    return { valid: false, message: "Invalid Token" };
  }
}

export { generateToken, verifyToken };
