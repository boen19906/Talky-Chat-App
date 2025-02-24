import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCFjhOFdDvFkZFtM8UiSAyJsUERl_CXb30",
    authDomain: "talky-chat-app-a6aa6.firebaseapp.com",
    projectId: "talky-chat-app-a6aa6",
    storageBucket: "talky-chat-app-a6aa6.firebasestorage.app",
    messagingSenderId: "395903214942",
    appId: "1:395903214942:web:e2d5c8312dbb1f30e61bcf"
  };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };