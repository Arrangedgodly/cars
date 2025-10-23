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

  // Determine the card's background color based on its status
  const cardBgClass = isOwned
    ? "bg-green-900"
    : isInWishlist
    ? "bg-amber-900"
    : "bg-zinc-500";

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
    <div className="flex flex-col items-center">
      <div className={`card ${cardBgClass} w-50 transition-colors duration-300`}>
        <figure>
          <img
            src={car.image}
            alt={car.name}
            className="w-full h-30 bg-white object-cover"
          />
        </figure>
        <div className="card-body items-center text-center gap-0 p-2">
          <div className="tooltip w-full" data-tip={car.name}>
            <h2 className="text-lg font-bold truncate">{car.name}</h2>
          </div>
          <div className="tooltip w-full" data-tip={car.series}>
            <p className="text-xs truncate">Series: {car.series}</p>
          </div>
          <div className="mt-1 text-center stats stats-vertical bg-transparent">
            <div className="stat">
              <p className="stat-title">Average Ranking</p>
              <p className="font-semibold stat-value">
                ⭐ {averageRating}
                <span className="ml-1 stat-desc">
                  ({car.ratingCount || 0} votes)
                </span>
              </p>
            </div>
          </div>

          {currentUser && (
            <div className="card-actions justify-center w-full mt-1 border-t border-slate-600 p-1">
              <p className="text-xs mb-1 w-full">Your Rating:</p>
              <StarRating
                rating={userRating}
                onRatingChange={handleSetRating}
                carId={car.id}
              />

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleCollectionToggle("wishlist")}
                  className={
                    isInWishlist
                      ? "btn btn-xs btn-warning"
                      : "btn btn-xs btn-outline"
                  }
                >
                  {isInWishlist ? "✓ In Wishlist" : "+ Wishlist"}
                </button>
                <button
                  onClick={() => handleCollectionToggle("ownedCars")}
                  className={
                    isOwned
                      ? "btn btn-xs btn-success"
                      : "btn btn-xs btn-outline"
                  }
                >
                  {isOwned ? "✓ Owned" : "I Own This"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-1 mt-2 w-full min-h-[22px]">
        {car.tags &&
          car.tags.length > 0 &&
          car.tags.map((tag) => (
            <div
              key={tag}
              className={`badge badge-primary badge-xs text-white`}
            >
              {tag}
            </div>
          ))}
      </div>
    </div>
  );
};

export default Car;