import { useState, useEffect } from "react";
import { auth, db } from "./firebase.js";
import { Routes, Route, Link, Navigate } from "react-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import SignUp from "./components/SignUp.jsx";
import SignIn from "./components/SignIn.jsx";
import Cars from "./components/Cars.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import UserPage from "./components/UserPage.jsx";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleRatingUpdate = (carId, newRatingData) => {
    setCurrentUser((prevUser) => ({
      ...prevUser,
      ratings: {
        ...prevUser.ratings,
        [carId]: newRatingData.newPersonalRating,
      },
    }));
    setCars((prevCars) =>
      prevCars.map((car) => {
        if (car.id === carId) {
          return {
            ...car,
            totalRatingScore: newRatingData.newTotalRatingScore,
            ratingCount: newRatingData.newRatingCount,
          };
        }
        return car;
      })
    );
  };

  const handleCollectionUpdate = (carId, collectionType, wasAdded) => {
    setCurrentUser((prevUser) => {
      const currentCollection = prevUser[collectionType] || [];
      const newCollection = wasAdded
        ? [...currentCollection, carId]
        : currentCollection.filter((id) => id !== carId);

      return {
        ...prevUser,
        [collectionType]: newCollection,
      };
    });
  };

  const handleCarAdded = (newCar) => {
    setCars((prevCars) => [...prevCars, newCar]);
  };

  const handleCarUpdated = (updatedCar) => {
    setCars((prevCars) =>
      prevCars.map((car) => (car.id === updatedCar.id ? updatedCar : car))
    );
  };

  const handleCarsTagged = (updatedCarIds, newTag) => {
    setCars((prevCars) =>
      prevCars.map((car) => {
        if (updatedCarIds.includes(car.id)) {
          const updatedTags = new Set(car.tags || []);
          updatedTags.add(newTag);
          return { ...car, tags: Array.from(updatedTags) };
        }
        return car;
      })
    );
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const firestoreUserData = userDocSnap.data();
          const combinedUser = {
            uid: user.uid,
            email: user.email,
            ...firestoreUserData,
          };
          setCurrentUser(combinedUser);
          setIsAdmin(firestoreUserData.isAdmin === true);
        } else {
          // This case handles newly signed-up users who might not have a doc yet
          setCurrentUser(user);
          setIsAdmin(false);
        }
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
        const querySnapshot = await getDocs(collection(db, "cars"));
        const carsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
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
      className="min-h-screen w-full flex flex-col items-center bg-zinc-900 text-base-content p-4"
      data-theme="cyberpunk"
    >
      <div className="navbar bg-zinc-800 rounded-box shadow-lg">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost text-xl">
            CarsDB
          </Link>
        </div>
        <div className="flex-none gap-2">
          {isAdmin && (
            <Link to="/admin" className="btn btn-outline btn-accent">
              Admin
            </Link>
          )}
          {currentUser ? (
            <>
              <Link to={`/user/${currentUser.uid}`} className="btn btn-outline">
                My Profile
              </Link>
              <button className="btn btn-outline" onClick={() => signOut(auth)}>
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-outline btn-primary">
              Sign In / Sign Up
            </Link>
          )}
        </div>
      </div>

      <div className="container mx-auto mt-8 flex flex-col items-center gap-8 w-full">
        {loading ? (
          <span className="loading loading-lg"></span>
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                <Cars
                  cars={cars}
                  currentUser={currentUser}
                  onRatingUpdate={handleRatingUpdate}
                  onCollectionUpdate={handleCollectionUpdate}
                />
              }
            />

            <Route
              path="/login"
              element={
                currentUser ? (
                  <Navigate to="/" replace />
                ) : (
                  <div className="card bg-base-200 shadow-xl p-8">
                    <div className="flex flex-col md:flex-row gap-8">
                      <SignIn />
                      <div className="divider md:divider-horizontal">OR</div>
                      <SignUp />
                    </div>
                  </div>
                )
              }
            />

            <Route
              path="/user/:userId"
              element={
                <UserPage
                  allCars={cars}
                  currentUser={currentUser}
                  onRatingUpdate={handleRatingUpdate}
                  onCollectionUpdate={handleCollectionUpdate}
                />
              }
            />

            <Route
              path="/admin"
              element={
                isAdmin ? (
                  <AdminDashboard
                    db={db}
                    isAdmin={isAdmin}
                    cars={cars}
                    onCarAdded={handleCarAdded}
                    onCarUpdated={handleCarUpdated}
                    onCarsTagged={handleCarsTagged}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
          </Routes>
        )}
      </div>
    </div>
  );
}

export default App;

