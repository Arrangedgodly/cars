import { doc, runTransaction } from "firebase/firestore";
import { db } from "../firebase";
import StarRating from "./StarRating";

const Car = ({ car, currentUser }) => {
  const averageRating =
    car.ratingCount > 0
      ? (car.totalRatingScore / car.ratingCount).toFixed(1)
      : 0;

  // Get the current user's rating for this specific car
  const userRating = currentUser?.ratings?.[car.id] || 0;

  // This function runs a transaction to ensure data consistency
  const handleSetRating = async (newRating) => {
    if (!currentUser) return;

    const carDocRef = doc(db, "cars", car.id);
    const userDocRef = doc(db, "users", currentUser.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const carDoc = await transaction.get(carDocRef);
        if (!carDoc.exists()) {
          throw "Car document does not exist!";
        }

        const oldRating = userRating; // The user's previous rating (0 if new)
        const ratingDiff = newRating - oldRating;

        let newRatingCount = carDoc.data().ratingCount;
        // Only increment the count if the user is rating for the first time
        if (oldRating === 0) {
          newRatingCount++;
        }

        // Update car's aggregate rating data
        transaction.update(carDocRef, {
          totalRatingScore: carDoc.data().totalRatingScore + ratingDiff,
          ratingCount: newRatingCount,
        });

        // Update user's personal rating for this car
        transaction.update(userDocRef, {
          [`ratings.${car.id}`]: newRating,
        });
      });
      console.log("Rating updated successfully!");
    } catch (e) {
      console.error("Transaction failed: ", e);
    }
  };

  return (
    <div className="card bg-slate-500">
      <figure>
        <img src={car.image} alt={car.name} className="w-full h-35 bg-white" />
      </figure>
      <div className="card-body items-center text-center p-4">
        <h2 className="text-md font-bold truncate">{car.name}</h2>
        <p className="text-xs truncate">Series: {car.series}</p>

        {/* Average Rating Display */}
        <div className="flex items-center gap-2 mt-2">
          <StarRating
            rating={parseFloat(averageRating)}
            carId={`${car.id}-avg`}
            readOnly={true}
          />
          <span className="text-sm font-semibold">
            {averageRating} ({car.ratingCount})
          </span>
        </div>

        {/* Logged-in User Actions */}
        {currentUser && (
          <div className="card-actions justify-center w-full mt-4 border-t border-slate-600 pt-4">
            <p className="text-xs mb-1">Your Rating:</p>
            <StarRating
              rating={userRating}
              onRatingChange={handleSetRating}
              carId={car.id}
            />
            {/* You can add your collection/wishlist buttons here later */}
          </div>
        )}
      </div>
    </div>
  );
};

export default Car;
