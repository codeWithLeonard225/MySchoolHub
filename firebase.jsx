// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";


const firebaseConfig = {
  apiKey: "AIzaSyCzmYnFl_Q8n7VWTWD2xdMlzJvrul_8xDo",
  authDomain: "myschoolhub-sl.firebaseapp.com",
  projectId: "myschoolhub-sl",
  storageBucket: "myschoolhub-sl.firebasestorage.app",
  messagingSenderId: "828034353905",
  appId: "1:828034353905:web:7b54db7c539786871c3750",
  measurementId: "G-8B8SSPZ1V1"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db };
