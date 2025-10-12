import getCars from "./firebase";
import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import SignUp from "./components/SignUp";
import SignIn from "./components/SignIn";
import Cars from "./components/Cars";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userDocRef = doc(db, "admins", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        setIsAdmin(userDocSnap.exists() && userDocSnap.data().isAdmin === true);
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      try {
        const carsData = await getCars();
        setCars(carsData);
      } catch (error) {
        console.error("Error fetching cars:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCars();
  }, []);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center bg-base-100 text-base-content p-4"
      data-theme="cyberpunk"
    >
      <div className="navbar bg-base-300 rounded-box shadow-lg">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">CarsDB</a>
        </div>
        <div className="flex-none">
          {currentUser && (
            <button className="btn btn-outline" onClick={() => signOut(auth)}>
              Sign Out
            </button>
          )}
        </div>
      </div>

      <div className="container mx-auto mt-8 flex flex-col items-center gap-8">
        {isAdmin && <AdminDashboard db={db} isAdmin={isAdmin} />}

        {currentUser ? (
          loading ? (
            <span className="loading loading-lg"></span>
          ) : (
            <Cars cars={cars} />
          )
        ) : (
          <div className="card bg-base-200 shadow-xl p-8">
            <h2 className="card-title mb-4">
              Please Sign In or Create an Account
            </h2>
            <div className="flex flex-col md:flex-row gap-8">
              <SignIn />
              <div className="divider md:divider-horizontal">OR</div>
              <SignUp />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
