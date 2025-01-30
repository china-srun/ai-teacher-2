// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore"; // Import Firestore for database usage
// import { getStorage } from "firebase/storage"; // Import Storage

// // Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyCZ1LI5kC0D-XLlOeg0dCxGTDyBRwQI9nY",
//   authDomain: "ai-teacher-email.firebaseapp.com",
//   projectId: "ai-teacher-email",
//   storageBucket: "ai-teacher-email.appspot.com", // Corrected storageBucket URL (if this was a typo)
//   messagingSenderId: "1067982971934",
//   appId: "1:1067982971934:web:c8c310e2d198eff9dcfa0f"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// // Initialize Firestore
// export const db = getFirestore(app);
// export const storage = getStorage(app);

// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore"; // Import Firestore for database usage
// import { getStorage } from "firebase/storage"; // Import Storage

// // Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyDBUa8NYuee1W_FpytZR03guL7aXeZdRHM",
//   authDomain: "ai-teacher-3202d.firebaseapp.com",
//   projectId: "ai-teacher-3202d",
//   storageBucket: "ai-teacher-3202d.firebasestorage.app",
//   messagingSenderId: "857748770978",
//   appId: "1:857748770978:web:4e33c31a6b0069509947fb"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// // // Initialize Firestore
// export const db = getFirestore(app);
// export const storage = getStorage(app);

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDBUa8NYuee1W_FpytZR03guL7aXeZdRHM",
  authDomain: "cooler-app-dfff9.firebaseapp.com",
  projectId: "cooler-app-dfff9",
  storageBucket: "cooler-app-dfff9.appspot.com",
  messagingSenderId: "358448564441",
  appId: "1:358448564441:web:2506b082f94d0b12c6d6c8",
  measurementId: "G-01BQHEFGQC"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

