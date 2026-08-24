import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Car from "./Car";

const UserPage = ({
  allCars,
  currentUser,
  onRatingUpdate,
  onCollectionUpdate,
}) => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      setLoading(true);
      setError(null);

      try {
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data());
        } else {
          setError("User not found.");
        }
      } catch (err) {
        setError("Failed to fetch user data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const wishlistCars = allCars
    .filter((car) => userData?.wishlist?.includes(car.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const ownedCars = allCars
    .filter((car) => userData?.ownedCars?.includes(car.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (loading)
    return (
      <div className="text-center">
        <span className="loading loading-lg"></span>
      </div>
    );
  if (error) return <div className="text-center text-error">{error}</div>;
  if (!userData) return null;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="text-center mb-10">
        <p className="font-fancy text-xs uppercase tracking-wider text-base-content/50 mb-1">
          User Profile
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
          {userData.email}
        </h1>
      </div>

      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-4 pb-2 border-b border-base-300 flex items-baseline gap-2">
          Owned
          <span className="font-fancy text-xs text-base-content/50">
            ({ownedCars.length})
          </span>
        </h2>
        {ownedCars.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {ownedCars.map((car) => (
              <Car
                key={car.id}
                car={car}
                currentUser={currentUser}
                onRatingUpdate={onRatingUpdate}
                onCollectionUpdate={onCollectionUpdate}
              />
            ))}
          </div>
        ) : (
          <p className="text-base-content/60 py-4">
            This user hasn't marked any cars as owned yet.
          </p>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 pb-2 border-b border-base-300 flex items-baseline gap-2">
          Wishlist
          <span className="font-fancy text-xs text-base-content/50">
            ({wishlistCars.length})
          </span>
        </h2>
        {wishlistCars.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {wishlistCars.map((car) => (
              <Car
                key={car.id}
                car={car}
                currentUser={currentUser}
                onRatingUpdate={onRatingUpdate}
                onCollectionUpdate={onCollectionUpdate}
              />
            ))}
          </div>
        ) : (
          <p className="text-base-content/60 py-4">This user's wishlist is empty.</p>
        )}
      </div>
    </div>
  );
};

export default UserPage;
