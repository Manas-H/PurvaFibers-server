const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    console.log("this is token:", token, process.env.JWTPRIVATEKEY);
    try {
      const user = jwt.verify(token, process.env.JWTPRIVATEKEY);
      console.log("this is user:", user);
      req.user = user;
      console.log("this is req:", user);
      next();
    } catch (err) {
      console.log("Token verification failed:", err);
      return res.status(401).json({ message: "Invalid token" });
    }
  } else {
    return res.status(400).json({ message: "Authorization required" });
  }
};


const verifyTokenAndAuthorization = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.isAdmin) {
      next();
    } else {
      res.status(403).json("You are not alowed to do that!");
    }
  });
};

const verifyTokenAndAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.isAdmin) {
      next();
    } else {
      res.status(403).json("You are not alowed to do that!");
    }
  });
};

module.exports = {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
};