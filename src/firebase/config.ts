import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDS-hqitMECj8geQbikHx2nj906uIA65yY",
  authDomain: "ima-alumni.firebaseapp.com",
  projectId: "ima-alumni",
  storageBucket: "ima-alumni.firebasestorage.app",
  messagingSenderId: "265908942486",
  appId: "1:265908942486:web:041c4b095ee20177ebb4b7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
