import { useState } from "react";
import {
  doc,
  runTransaction,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase";
import StarRating from "./StarRating";
import RatingStars from "./RatingStars";
import HighlightText from "./HighlightText";

const Car = ({ car, currentUser, onRatingUpdate, onCollectionUpdate, matches }) => {
  const [actionError, setActionError] = useState(null);
  const nameRanges = (matches ?? [])
    .filter((m) => m.key === "name")
    .flatMap((m) => m.indices);
  const seriesRanges = (matches ?? [])
    .filter((m) => m.key === "series")
    .flatMap((m) => m.indices);
  const tagMatches = (matches ?? []).filter((m) => m.key === "tags");

  const averageRatingValue =
    car.ratingCount > 0 ? car.totalRatingScore / car.ratingCount : 0;
  const averageRating = averageRatingValue.toFixed(1);

  const userRating = currentUser?.ratings?.[car.id] || 0;
  const isInWishlist = currentUser?.wishlist?.includes(car.id);
  const isOwned = currentUser?.ownedCars?.includes(car.id);

  const edgeAccentClass = isOwned
    ? "border-l-4 border-success"
    : isInWishlist
    ? "border-l-4 border-warning"
    : "border-l-4 border-transparent";

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

      setActionError(null);
    } catch (e) {
      console.error("Transaction failed: ", e);
      setActionError("Couldn't save your rating.");
    }
  };

  const handleCollectionToggle = async (collectionType) => {
    if (!currentUser) return;

    const userDocRef = doc(db, "users", currentUser.uid);
    const isInCollection =
      collectionType === "wishlist" ? isInWishlist : isOwned;

    try {
      await updateDoc(userDocRef, {
        [collectionType]: isInCollection
          ? arrayRemove(car.id)
          : arrayUnion(car.id),
      });

      onCollectionUpdate(car.id, collectionType, !isInCollection);
      setActionError(null);
    } catch (e) {
      // Previously unguarded: a rejection here (most often a missing profile
      // document) surfaced only as an unhandled rejection in the console, so
      // the button appeared to do nothing at all.
      console.error("Collection update failed: ", e);
      setActionError(
        collectionType === "wishlist"
          ? "Couldn't update your wishlist."
          : "Couldn't update your collection."
      );
    }
  };

  return (
    <div className="flex flex-col gap-1.5 h-full w-full">
      <div
        className={`card bg-base-300 border border-base-300 ${edgeAccentClass} rounded-xl overflow-hidden transition-transform duration-150 hover:-translate-y-0.5 hover:border-primary/60 w-full flex-grow`}
      >
        <figure className="relative bg-white">
          <img
            src={car.cloudinary ? car.cloudinary.secure_url : car.image}
            alt={car.name}
            className="w-full aspect-[4/3] object-cover"
          />
          {(isOwned || isInWishlist) && (
            <span
              className={`absolute top-1.5 right-1.5 font-fancy text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                isOwned
                  ? "bg-success/15 text-success border-success/40"
                  : "bg-warning/15 text-warning border-warning/40"
              }`}
            >
              {isOwned ? "Owned" : "Wishlist"}
            </span>
          )}
        </figure>
        <div className="card-body car-card-surface p-2.5 gap-1.5">
          <h2 className="text-sm font-semibold leading-tight text-base-content">
            <HighlightText text={car.name} ranges={nameRanges} />
          </h2>
          <p className="font-fancy text-[9px] uppercase tracking-wide text-base-content/50">
            <HighlightText text={car.series} ranges={seriesRanges} />
          </p>

          <div className="flex items-center justify-between mt-0.5">
            <RatingStars value={averageRatingValue} />
            <span className="font-fancy text-[9px] text-base-content/50">
              {averageRating} ({car.ratingCount || 0})
            </span>
          </div>

          {currentUser && (
            <div className="flex flex-col gap-1 mt-1 pt-1.5 border-t border-base-300 min-w-0">
              <span className="font-fancy text-[9px] uppercase tracking-wide text-base-content/50">
                Your Rating
              </span>
              <StarRating
                rating={userRating}
                onRatingChange={handleSetRating}
                carId={car.id}
                size="sm"
              />

              <div className="flex gap-1.5 mt-0.5">
                <button
                  onClick={() => handleCollectionToggle("wishlist")}
                  className={
                    isInWishlist
                      ? "btn btn-xs flex-1 min-w-0 text-[10px] px-1 btn-warning"
                      : "btn btn-xs flex-1 min-w-0 text-[10px] px-1 btn-outline"
                  }
                >
                  {isInWishlist ? "✓ Wishlist" : "Wishlist"}
                </button>
                <button
                  onClick={() => handleCollectionToggle("ownedCars")}
                  className={
                    isOwned
                      ? "btn btn-xs flex-1 min-w-0 text-[10px] px-1 btn-success"
                      : "btn btn-xs flex-1 min-w-0 text-[10px] px-1 btn-outline"
                  }
                >
                  {isOwned ? "✓ Owned" : "Owned"}
                </button>
              </div>

              {actionError && (
                <p role="alert" className="text-error text-[9px] leading-tight mt-0.5">
                  {actionError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 min-h-[18px]">
        {car.tags &&
          car.tags.length > 0 &&
          car.tags.map((tag, index) => (
            <span
              key={tag}
              className="font-fancy text-[8px] tracking-wide px-1.5 py-0.5 rounded bg-base-200 border border-base-300 text-base-content/60"
            >
              <HighlightText
                text={tag}
                ranges={
                  tagMatches.find((m) => m.arrayIndex === index)?.indices
                }
              />
            </span>
          ))}
      </div>
    </div>
  );
};

export default Car;
