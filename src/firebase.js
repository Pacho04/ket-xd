// firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// ❗ analytics opcional (puedes quitarlo si quieres)
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBj8TI-HrE39SCsw-QNwehBNJRQRrqiRKk",
  authDomain: "ket-xd.firebaseapp.com",
  projectId: "ket-xd",
  storageBucket: "ket-xd.firebasestorage.app",
  messagingSenderId: "815470658772",
  appId: "1:815470658772:web:0f1ca06e8a6fe37d606741",
  measurementId: "G-RSK8MDKPMP"
};

const app = initializeApp(firebaseConfig);

// ✅ ESTO ES LO IMPORTANTE
export const db = getFirestore(app);
export const storage = getStorage(app);

// opcional
export const analytics = getAnalytics(app);