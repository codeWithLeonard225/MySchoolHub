// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";


const firebaseConfig = {
  apiKey: "AIzaSyAcVNYoHRo9H336sOWvPV22fP-KSSHGKaU",
  authDomain: "zadet-a4354.firebaseapp.com",
  projectId: "zadet-a4354",
  storageBucket: "zadet-a4354.firebasestorage.app",
  messagingSenderId: "19581889077",
  appId: "1:19581889077:web:ea5a72fa29204c1c199f7c",
  measurementId: "G-9SS4ZR15ZE"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db };
