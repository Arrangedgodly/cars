import {
  doc,
  runTransaction,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase";
import StarRating from "./StarRating";

const Car = ({ car, currentUser, onRatingUpdate, onCollectionUpdate }) => {
  const averageRating =
    car.ratingCount > 0
      ? (car.totalRatingScore / car.ratingCount).toFixed(1)
      : 0;

  const userRating = currentUser?.ratings?.[car.id] || 0;
  const isInWishlist = currentUser?.wishlist?.includes(car.id);
  const isOwned = currentUser?.ownedCars?.includes(car.id);

  const handleSetRating = async (newRating) => {
    if (!currentUser) return;

    const carDocRef = doc(db, "cars", car.id);
    const userDocRef = doc(db, "users", currentUser.uid);

    const oldRating = currentUser?.ratings?.[car.id] || 0;
    const ratingDiff = newRating - oldRating;

    const currentTotalScore = car.totalRatingScore || 0;
    const currentRatingCount = car.ratingCount || 0;

    const newTotalRatingScore = currentTotalScore + ratingDiff;
    let newRatingCount = currentRatingCount;
    if (oldRating === 0) {
      newRatingCount++;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const carDoc = await transaction.get(carDocRef);
        if (!carDoc.exists()) throw "Car document does not exist!";

        transaction.update(carDocRef, {
          totalRatingScore: newTotalRatingScore,
          ratingCount: newRatingCount,
        });

        transaction.update(userDocRef, {
          [`ratings.${car.id}`]: newRating,
        });
      });

      onRatingUpdate(car.id, {
        newTotalRatingScore,
        newRatingCount,
        newPersonalRating: newRating,
      });

      console.log("Rating updated successfully!");
    } catch (e) {
      console.error("Transaction failed: ", e);
    }
  };

  const handleCollectionToggle = async (collectionType) => {
    if (!currentUser) return;

    const userDocRef = doc(db, "users", currentUser.uid);
    const isInCollection =
      collectionType === "wishlist" ? isInWishlist : isOwned;

    await updateDoc(userDocRef, {
      [collectionType]: isInCollection
        ? arrayRemove(car.id)
        : arrayUnion(car.id),
    });

    onCollectionUpdate(car.id, collectionType, !isInCollection);
  };

  return (
    <div className="card bg-slate-500">
      <figure>
        <img src={car.image} alt={car.name} className="w-full h-30 bg-white" />
      </figure>
      <div className="card-body items-center text-center p-2">
        <div className="tooltip w-[85%]" data-tip={car.name}>
          <h2 className="text-lg font-bold truncate">{car.name}</h2>
        </div>
        <p className="text-xs truncate">Series: {car.series}</p>

        <div className="mt-2 text-center">
          <p className="text-sm font-semibold">
            ⭐ {averageRating}
            <span className="text-xs font-normal ml-1">
              ({car.ratingCount || 0} votes)
            </span>
          </p>
        </div>

        {currentUser && (
          <div className="card-actions justify-center w-full mt-4 border-t border-slate-600 pt-4">
            <p className="text-xs mb-1">Your Rating:</p>
            <StarRating
              rating={userRating}
              onRatingChange={handleSetRating}
              carId={car.id}
            />

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleCollectionToggle("wishlist")}
                className={isInWishlist ? "btn btn-xs btn-warning" : "btn btn-xs btn-outline"}
              >
                {isInWishlist ? "✓ In Wishlist" : "+ Wishlist"}
              </button>
              <button
                onClick={() => handleCollectionToggle("ownedCars")}
                className={isOwned ? "btn btn-xs btn-success" : "btn btn-xs btn-outline"}
              >
                {isOwned ? "✓ Owned" : "I Own This"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Car;
