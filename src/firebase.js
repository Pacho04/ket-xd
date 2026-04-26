import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // 👈 Añade esto
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCHZEaOhjvG85UBfG6X98VBwh7fxhPqCzg",
  authDomain: "rellenitas-xd.firebaseapp.com",
  projectId: "rellenitas-xd",
  storageBucket: "rellenitas-xd.firebasestorage.app",
  messagingSenderId: "119991634640",
  appId: "1:119991634640:web:691dcbbd1b9b78c0072cd5",
  measurementId: "G-8NRFNQG37C"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // 👈 Exportamos 'db' para usarlo en App.jsx
const analytics = getAnalytics(app);