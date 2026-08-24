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
import LogoMark from "./components/LogoMark.jsx";
import ThemePicker from "./components/ThemePicker.jsx";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [character, setCharacter] = useState(
    () => localStorage.getItem("carsdb-character") || "circuitred"
  );
  const [mode, setMode] = useState(
    () => localStorage.getItem("carsdb-mode") || "dark"
  );
  const theme = `${character}-${mode}`;

  useEffect(() => {
    localStorage.setItem("carsdb-character", character);
  }, [character]);

  useEffect(() => {
    localStorage.setItem("carsdb-mode", mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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
      className="min-h-screen w-full flex flex-col items-center bg-base-100 text-base-content p-3 sm:p-4"
    >
      <div className="navbar w-full max-w-6xl bg-base-200 border border-base-300 rounded-box shadow-lg px-3 sm:px-4">
        <div className="flex-1">
          <Link to="/" className="flex items-center gap-2.5 py-1">
            <LogoMark className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 text-base-content" />
            <span className="font-fancy font-bold uppercase tracking-wider text-sm sm:text-base text-base-content">
              Cars<span className="text-primary">DB</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ThemePicker
            character={character}
            mode={mode}
            onCharacterChange={setCharacter}
            onModeChange={setMode}
          />
          {isAdmin && (
            <Link to="/admin" className="btn btn-outline btn-accent btn-sm">
              Admin
            </Link>
          )}
          {currentUser ? (
            <>
              <Link to={`/user/${currentUser.uid}`} className="btn btn-outline btn-sm">
                My Profile
              </Link>
              <button className="btn btn-outline btn-sm" onClick={() => signOut(auth)}>
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-gradient-primary btn-sm">
              Sign In / Sign Up
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto mt-6 sm:mt-8 flex flex-col items-center gap-8 w-full max-w-6xl">
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
                  <div className="card bg-base-200 border border-base-300 shadow-xl p-6 sm:p-8 w-full max-w-2xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                      <SignIn />
                      <div className="divider md:divider-horizontal font-fancy text-xs text-base-content/40">
                        OR
                      </div>
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

