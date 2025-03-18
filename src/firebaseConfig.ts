import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountBase64) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable');
}

interface ServiceAccount {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
}

const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountBase64, 'base64').toString('utf8')
) as ServiceAccount;

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount as any),
        projectId: serviceAccount.project_id,
    });
} else {
    getApp();
}

const adminDb: Firestore = getFirestore();

export { adminDb }; 