import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Car from './Car';

const UserPage = ({ allCars, currentUser, onRatingUpdate, onCollectionUpdate }) => {
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
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data());
        } else {
          setError('User not found.');
        }
      } catch (err) {
        setError('Failed to fetch user data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const wishlistCars = allCars.filter(car => userData?.wishlist?.includes(car.id));
  const ownedCars = allCars.filter(car => userData?.ownedCars?.includes(car.id));

  if (loading) return <div className="text-center"><span className="loading loading-lg"></span></div>;
  if (error) return <div className="text-center text-error">{error}</div>;
  if (!userData) return null;

  return (
    <div className="container mx-auto p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">User Profile</h1>
        <p className="text-lg text-gray-400">{userData.email}</p>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 border-b pb-2">Owned Cars ({ownedCars.length})</h2>
        {ownedCars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {ownedCars.map(car => (
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
          <p>This user hasn't added any cars to their collection yet.</p>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2">Wishlist ({wishlistCars.length})</h2>
        {wishlistCars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {wishlistCars.map(car => (
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
          <p>This user's wishlist is empty.</p>
        )}
      </div>
    </div>
  );
};

export default UserPage;