const jwt = require("jsonwebtoken");

function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production.");
  }

  return "local-development-secret-change-me";
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

module.exports = {
  createToken,
  publicUser,
  verifyToken
};
