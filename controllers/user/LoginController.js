const { admin, db } = require('../../config/firebase');
const jwt = require('jsonwebtoken');
const NodeCache = new require('node-cache');
const tokenCache = new NodeCache({ stdTTL: 300 });

exports.verifyFirebaseToken = async (req, res) => {
  try {
    const { idToken, rememberMe, sameWhatsapp } = req.body;

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phoneNumber = decodedToken.phone_number;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number not found in token" });
    }

    const expiresIn = rememberMe ? '7d' : '24h';
    const token = jwt.sign({ phoneNumber, role: 'USER' }, process.env.JWT_SECRET, { expiresIn });

    const expirationDate = new Date(Date.now() + (rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
    
    // Store token in Firestore
    await db.collection('tokens').doc(phoneNumber).set({
      token,
      expiresAt: admin.firestore.Timestamp.fromDate(expirationDate)
    });

    // Check and update user profile in Firestore
    const userProfile = await db
      .collection('UserProfile')
      .doc(phoneNumber)
      .get();

    if (!userProfile.exists) {
      await db.collection('UserProfile').doc(phoneNumber).set({
        phoneNumber,
        sameNumberOnWhatsapp: sameWhatsapp ? phoneNumber : '',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // res.cookie('token', token, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: 'none',
    //   maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    // });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.onrender.com',
      path: '/',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ 
      message: "Logged in successfully",
      token
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: "Verification error occurred." });
  }
};

// The isAuthenticated and logout functions remain the same
exports.isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Invalid token." });
    }

    // Get the identifier based on role
    const identifier = decoded.role === 'ADMIN' ? decoded.email : decoded.phoneNumber;
    
    if (!identifier) {
      return res.status(401).json({ message: "Invalid token format." });
    }

    const cachedToken = tokenCache.get(identifier);
    if (cachedToken === token) {
      req.user = { 
        phoneNumber: decoded.phoneNumber,
        email: decoded.email,
        role: decoded.role
      };
      return next();
    }

    const tokenDoc = await db
      .collection('tokens')
      .doc(identifier)
      .get();

    if (!tokenDoc.exists || tokenDoc.data().token !== token || 
        tokenDoc.data().expiresAt.toDate() < new Date()) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    tokenCache.set(identifier, token);
    req.user = { 
      phoneNumber: decoded.phoneNumber,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: "Authentication failed." });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(200).json({ 
        message: "Already Logged Out, Please login again to continue." 
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await db.collection('tokens').doc(decoded.phoneNumber).delete();
      tokenCache.del(decoded.phoneNumber);
    } catch (jwtError) {
      console.error('JWT verification failed during logout:', jwtError);
    }

    // Clear the cookie from the response
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: "Logout error occurred." });
  }
};