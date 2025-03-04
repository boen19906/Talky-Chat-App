import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


/*const firebaseConfig = {
  apiKey: "AIzaSyBxVPFLuRVQyclwo9rbTVxjyqHaSMMF5jA",
  authDomain: "talky-aws.firebaseapp.com",
  projectId: "talky-aws",
  storageBucket: "talky-aws.appspot.com", 
  messagingSenderId: "54739542949",
  appId: "1:54739542949:web:4792e5547ac230166cbe4c",
};
*/
const firebaseConfig = {
  apiKey: "AIzaSyBxVPFLuRVQyclwo9rbTVxjyqHaSMMF5jA",
  authDomain: "talky-aws.firebaseapp.com",
  projectId: "talky-aws",
  storageBucket: "talky-aws.firebasestorage.app", 
  messagingSenderId: "54739542949",
  appId: "1:54739542949:web:4792e5547ac230166cbe4c",
};
const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
