// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyDhNEPllB-llogXnJ4HOLFqtSWjZMvK2aU",
  authDomain: "zapsolve-44e06.firebaseapp.com",
  projectId: "zapsolve-44e06",
  storageBucket: "zapsolve-44e06.firebasestorage.app",
  messagingSenderId: "607701754693",
  appId: "1:607701754693:web:ab797caaf551c01d11542c",
  measurementId: "G-60E4PQR0XQ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
auth.languageCode = "en";
// Exporting these as named exports
export { provider, auth, getAuth, signInWithPopup, GoogleAuthProvider };
