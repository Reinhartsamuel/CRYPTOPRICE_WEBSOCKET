const { initializeApp, cert, getApps, getApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountBase64) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable');
}

const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountBase64, 'base64').toString('utf8')
);

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
    });
} else {
    getApp();
}

const adminDb = getFirestore();

module.exports = { adminDb }; 