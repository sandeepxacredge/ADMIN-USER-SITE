const jwt = require('jsonwebtoken');

const verifyUserForAdminRoutes = (req, res, next) => {
  console.log('Cookies received:', req.cookies);
  console.log('Auth header:', req.headers.authorization);

  let token = req.cookies.token;
  
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'USER') {
      return res.status(403).json({ message: "Access denied. User only." });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token." });
  }
};

const verifyAdminForUserRoutes = (req, res, next) => {
  let token = req.cookies.token;
  
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token." });
  }
};

module.exports = {
  verifyUserForAdminRoutes,
  verifyAdminForUserRoutes
};