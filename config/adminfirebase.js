const admin = require('firebase-admin');
require('dotenv').config();

const adminServiceAccount = {
  projectId: process.env.ADMIN_FIREBASE_PROJECT_ID,
  privateKey: process.env.ADMIN_FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  clientEmail: process.env.ADMIN_FIREBASE_CLIENT_EMAIL
};

const adminApp = admin.initializeApp({
  credential: admin.credential.cert(adminServiceAccount),
  storageBucket: process.env.ADMIN_FIREBASE_STORAGE_BUCKET
}, 'admin');

const adminDb = adminApp.firestore();
const adminBucket = adminApp.storage().bucket();

module.exports = { admin: adminApp, db: adminDb, bucket: adminBucket };