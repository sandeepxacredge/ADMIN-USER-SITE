const jwt = require('jsonwebtoken');
const { isAuthenticated } = require('../controllers/LoginController');

exports.verifyToken = (req, res, next) => {

  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: "No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized!" });
    }

    req.user = decoded;

    next();
  });
};

module.exports = {
  verifyToken: isAuthenticated
};