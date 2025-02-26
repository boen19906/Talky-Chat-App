import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxVPFLuRVQyclwo9rbTVxjyqHaSMMF5jA",
  authDomain: "talky-aws.firebaseapp.com",
  projectId: "talky-aws",
  storageBucket: "talky-aws.firebasestorage.app",
  messagingSenderId: "54739542949",
  appId: "1:54739542949:web:4792e5547ac230166cbe4c"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };