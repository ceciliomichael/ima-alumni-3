import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAJTnYEjjNYfLyUI28FeMbxL-CEMR5zNK0",
  authDomain: "alumni-com.firebaseapp.com",
  projectId: "alumni-com",
  storageBucket: "alumni-com.firebasestorage.app",
  messagingSenderId: "704915226439",
  appId: "1:704915226439:web:5c1a9b75b5c91813ead662"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
