const admin = require('firebase-admin');
require('dotenv').config();

const userServiceAccount = {
  project_id: process.env.USER_FIREBASE_PROJECT_ID,
  private_key: process.env.USER_FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.USER_FIREBASE_CLIENT_EMAIL,
};

const userApp = admin.initializeApp({
  credential: admin.credential.cert(userServiceAccount),
  storageBucket: process.env.USER_FIREBASE_STORAGE_BUCKET
}, 'user');

const userDb = userApp.firestore();
const userBucket = userApp.storage().bucket();

module.exports = { admin: userApp, db: userDb, bucket: userBucket };