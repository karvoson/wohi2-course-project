const jwt = require("jsonwebtoken");
const { ForbiddenError } = require("../lib/errors");
const SECRET = process.env.JWT_SECRET || "secret";

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader.startsWith("Bearer ")) {
    throw new ForbiddenError("No token provided");
  }
  const token = authHeader.split(" ")[1];
  try {

    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch(err) {
    req.log.warn({},"Error authenticatig");
    throw new ForbiddenError("invalid or expired token");
  }

}

module.exports = authenticate;
