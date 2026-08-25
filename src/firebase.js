import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

// Shape of a brand new profile. `isAdmin: false` and an `email` matching the
// auth token are both required by the create rule in firestore.rules.
const blankProfile = (user) => ({
  email: user.email,
  isAdmin: false,
  ownedCars: [],
  wishlist: [],
  ratings: {},
});

// Reads the signed-in user's profile, creating it on first sign-in.
// This lives here — and is called from the auth-state listener in App — rather
// than in SignUp/SignIn, because those components unmount the instant auth
// state flips, which silently swallowed any error from the write. Running it
// from the listener also means accounts that never got a profile document heal
// themselves the next time they sign in.
export const ensureUserProfile = async (user) => {
  const userDocRef = doc(db, "users", user.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) return userDocSnap.data();

  const profile = blankProfile(user);
  await setDoc(userDocRef, profile);
  return profile;
};

const getCars = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "cars"));
    // Combine the document ID with the rest of the car data
    const carsData = querySnapshot.docs.map(car => ({ 
      id: car.id, 
      ...car.data() 
    }));
    return carsData;
  } catch (error) {
    console.error("Error fetching data: ", error);
    return [];
  }
};

export default getCars;
