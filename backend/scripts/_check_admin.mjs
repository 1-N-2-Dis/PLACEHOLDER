import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-saferroute' });
const auth = getAuth();
const db = getFirestore();

const user = await auth.getUserByEmail('admin@gmail.com');
console.log('Auth user uid:', user.uid);
console.log('Auth user email:', user.email);

const snap = await db.collection('users').doc(user.uid).get();
console.log('Firestore doc exists:', snap.exists);
console.log('Firestore doc data:', snap.exists ? JSON.stringify(snap.data()) : null);

console.log('\n--- All docs in users collection ---');
const all = await db.collection('users').get();
all.forEach(d => console.log(d.id, JSON.stringify(d.data())));
