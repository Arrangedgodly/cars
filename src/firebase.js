import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC0dIek_KDVAD2iCsNEShjkBEcfQBAtupM",
  authDomain: "cars-b0ceb.firebaseapp.com",
  projectId: "cars-b0ceb",
  storageBucket: "cars-b0ceb.firebasestorage.app",
  messagingSenderId: "784695795447",
  appId: "1:784695795447:web:a515848e9a3c973d7c3df2",
  measurementId: "G-3M55JG7KMM",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

const getCars = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "cars"));
    const carsData = querySnapshot.docs.map(car => car.data());
    return carsData;
  } catch (error) {
    console.error("Error fetching data: ", error);
    return []; 
  }
};

export default getCars;
