// Firebase Configuration for Marketing Engine
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCVLSe5BCxCwD0WhLRDwfKK21szMkBAiPQ",
  authDomain: "marketing-engine-web.firebaseapp.com",
  projectId: "marketing-engine-web",
  storageBucket: "marketing-engine-web.firebasestorage.app",
  messagingSenderId: "740794505815",
  appId: "1:740794505815:web:b420f45560f2eaad01e112",
  measurementId: "G-Y3QR0YCCFS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
