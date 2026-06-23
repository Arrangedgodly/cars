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

  const getTagColor = (tagString) => {
  if (!tagString) return "hsl(0, 0%, 50%)";

  let hash = 0;
  for (let i = 0; i < tagString.length; i++) {
    const char = tagString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  
  const hue = Math.abs(hash) % 360;
  const saturation = 70;
  const lightness = 50;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

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
    <div className="flex flex-col items-center h-full">
      <div
        className={`card ${cardBgClass} w-40 lg:w-50 transition-colors duration-300 flex-grow`}
      >
        <figure>
          <img
            src={car.cloudinary ? car.cloudinary.secure_url : car.image}
            alt={car.name}
            className="w-full h-30 bg-white object-cover"
          />
        </figure>
        <div className="card-body items-center text-center gap-0 p-1 w-full">
          <h2 className="text-[14px] font-bold text-wrap w-full">{car.name}</h2>
          <p className="text-xs text-balance italic w-full">{car.series}</p>
          <div className="text-center stats stats-vertical bg-transparent">
            <div className="stat p-1">
              <p className="stat-title">Average Ranking</p>
              <p className="font-semibold stat-value text-[14px]">
                ⭐ {averageRating}
                <span className="ml-1 stat-desc text-[10px]">
                  ({car.ratingCount || 0} votes)
                </span>
              </p>
            </div>
          </div>

          {currentUser && (
            <div className="card-actions justify-center w-full mt-1 border-t border-slate-600 pb-1">
              <p className="text-xs w-full">Your Rating:</p>
              <StarRating
                rating={userRating}
                onRatingChange={handleSetRating}
                carId={car.id}
              />

              <div className="flex mt-1 gap-1 w-full justify-center">
                <button
                  onClick={() => handleCollectionToggle("wishlist")}
                  className={
                    isInWishlist
                      ? "btn btn-xs text-[10px] btn-warning"
                      : "btn btn-xs text-[10px] btn-outline"
                  }
                >
                  {isInWishlist ? "✓ Wishlist" : "+ Wishlist"}
                </button>
                <button
                  onClick={() => handleCollectionToggle("ownedCars")}
                  className={
                    isOwned
                      ? "btn btn-xs text-[10px] btn-success"
                      : "btn btn-xs text-[10px] btn-outline"
                  }
                >
                  {isOwned ? "✓ Owned" : "I Own This"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-1 w-full min-h-[22px]">
        {car.tags &&
          car.tags.length > 0 &&
          car.tags.map((tag) => (
            <div
              key={tag}
              className="badge badge-xs text-white"
              style={{ backgroundColor: getTagColor(tag) }}
            >
              {tag}
            </div>
          ))}
      </div>
    </div>
  );
};

export default Car;
