import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// The firestoreDatabaseId is required for enterprise databases
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Test connection as required by instructions
async function testConnection() {
  try {
    // Try to get a non-existent doc just to verify connection
    // This might fail with Permission Denied depending on rules, 
    // but code=permission-denied still means we REACHED the server.
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("✅ Firebase connection verified successfully");
  } catch (error) {
    const err = error as any;
    if (err.code === 'permission-denied') {
      console.log("✅ Firebase connection successful (reached server, but read was denied - which is expected for secured paths)");
    } else if (err.code === 'unavailable' || (err.message && err.message.includes('the client is offline'))) {
      console.error("❌ CRITICAL: Firestore backend is unreachable. This may be due to network issues, AdBlockers, or database provisioning delay.");
    } else {
      console.error("❌ Firebase Connection Error:", err.code, err.message);
    }
  }
}

testConnection();
