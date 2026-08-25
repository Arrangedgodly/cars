import { useEffect, useRef, useState } from "react";
import {
  doc,
  FieldPath,
  runTransaction,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase";
import StarRating from "./StarRating";
import RatingStars from "./RatingStars";
import HighlightText from "./HighlightText";

const normalizeRating = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;

  return Math.min(5, Math.max(0, Math.round(numericValue * 2) / 2));
};

const normalizeNonNegativeNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
};

const normalizeNonNegativeInteger = (value) =>
  Math.floor(normalizeNonNegativeNumber(value));

const getImageSource = (car) => {
  const candidate = car?.cloudinary?.secure_url ?? car?.image;
  return typeof candidate === "string" && candidate.trim() ? candidate : null;
};

const getMatchRanges = (matches, key, text, arrayIndex) => {
  if (!Array.isArray(matches) || !text) return [];

  return matches
    .filter(
      (match) =>
        match?.key === key &&
        (arrayIndex === undefined || match.arrayIndex === arrayIndex)
    )
    .flatMap((match) => (Array.isArray(match.indices) ? match.indices : []))
    .filter(
      (range) =>
        Array.isArray(range) &&
        range.length >= 2 &&
        Number.isInteger(range[0]) &&
        Number.isInteger(range[1]) &&
        range[0] <= range[1]
    )
    .map(([start, end]) => [
      Math.max(0, start),
      Math.min(text.length - 1, end),
    ])
    .filter(([start, end]) => start <= end);
};

const Car = ({ car, currentUser, onRatingUpdate, onCollectionUpdate, matches }) => {
  const [actionError, setActionError] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const actionLockRef = useRef(null);

  const carId = car?.id == null ? null : String(car.id).trim();
  const userId =
    typeof currentUser?.uid === "string" && currentUser.uid.trim()
      ? currentUser.uid.trim()
      : null;
  const carName =
    typeof car?.name === "string" && car.name.trim() ? car.name : "Unnamed car";
  const seriesName =
    typeof car?.series === "string" && car.series.trim()
      ? car.series
      : "Uncategorized";
  const tagEntries = Array.isArray(car?.tags)
    ? car.tags
        .map((tag, index) => ({ tag, index }))
        .filter(({ tag }) => typeof tag === "string" && tag.trim())
    : [];
  const safeMatches = Array.isArray(matches) ? matches : [];
  const nameRanges = getMatchRanges(safeMatches, "name", carName);
  const seriesRanges = getMatchRanges(safeMatches, "series", seriesName);
  const imageSource = getImageSource(car);
  const [imageSrc, setImageSrc] = useState(imageSource);
  const [imageFailed, setImageFailed] = useState(!imageSource);

  useEffect(() => {
    setImageSrc(imageSource);
    setImageFailed(!imageSource);
  }, [imageSource]);

  const ratingCount = normalizeNonNegativeInteger(car?.ratingCount);
  const totalRatingScore = normalizeNonNegativeNumber(car?.totalRatingScore);
  const averageRatingValue =
    ratingCount > 0
      ? Math.min(5, Math.max(0, totalRatingScore / ratingCount))
      : 0;
  const averageRating = averageRatingValue.toFixed(1);

  const userRating = carId ? normalizeRating(currentUser?.ratings?.[carId]) : 0;
  const wishlistIds = Array.isArray(currentUser?.wishlist)
    ? currentUser.wishlist
    : [];
  const ownedIds = Array.isArray(currentUser?.ownedCars)
    ? currentUser.ownedCars
    : [];
  const isInWishlist = Boolean(carId && wishlistIds.includes(carId));
  const isOwned = Boolean(carId && ownedIds.includes(carId));
  const collectionStatus = isOwned && isInWishlist
    ? "Owned · Wishlist"
    : isOwned
    ? "Owned"
    : "Wishlist";

  const beginAction = (action) => {
    if (actionLockRef.current) return false;

    actionLockRef.current = action;
    setPendingAction(action);
    return true;
  };

  const finishAction = () => {
    actionLockRef.current = null;
    setPendingAction(null);
  };

  const edgeAccentClass = isOwned
    ? "ring-1 ring-inset ring-success/60"
    : isInWishlist
    ? "ring-1 ring-inset ring-warning/60"
    : "";

  const handleSetRating = async (newRating) => {
    if (!currentUser || actionLockRef.current) return;

    const numericRating = Number(newRating);
    if (
      !Number.isFinite(numericRating) ||
      numericRating < 0.5 ||
      numericRating > 5 ||
      !Number.isInteger(numericRating * 2)
    ) {
      setActionError("Choose a rating from 0.5 to 5 stars.");
      return;
    }

    if (!carId || !userId) {
      setActionError("This car cannot be updated right now.");
      return;
    }

    const nextRating = normalizeRating(numericRating);
    if (nextRating === userRating) return;
    if (!beginAction("rating")) return;

    const carDocRef = doc(db, "cars", carId);
    const userDocRef = doc(db, "users", userId);

    try {
      let newTotalRatingScore = 0;
      let newRatingCount = 0;

      await runTransaction(db, async (transaction) => {
        const carDoc = await transaction.get(carDocRef);
        const userDoc = await transaction.get(userDocRef);
        if (!carDoc.exists()) throw new Error("Car document does not exist.");
        if (!userDoc.exists()) throw new Error("User profile does not exist.");

        const storedCar = carDoc.data() ?? {};
        const storedUser = userDoc.data() ?? {};
        const oldRating = normalizeRating(storedUser.ratings?.[carId]);
        const currentTotalScore = normalizeNonNegativeNumber(
          storedCar.totalRatingScore
        );
        const currentRatingCount = normalizeNonNegativeInteger(
          storedCar.ratingCount
        );

        newTotalRatingScore = Math.max(
          0,
          currentTotalScore + nextRating - oldRating
        );
        newRatingCount = oldRating === 0
          ? currentRatingCount + 1
          : currentRatingCount;

        transaction.update(carDocRef, {
          totalRatingScore: newTotalRatingScore,
          ratingCount: newRatingCount,
        });

        transaction.update(
          userDocRef,
          new FieldPath("ratings", carId),
          nextRating
        );
      });

      if (typeof onRatingUpdate === "function") {
        onRatingUpdate(carId, {
          newTotalRatingScore,
          newRatingCount,
          newPersonalRating: nextRating,
        });
      }

      setActionError(null);
    } catch (e) {
      console.error("Rating transaction failed:", e);
      setActionError("Couldn't save your rating. Check your connection and try again.");
    } finally {
      finishAction();
    }
  };

  const handleCollectionToggle = async (collectionType) => {
    if (!currentUser || actionLockRef.current) return;

    const collectionField =
      collectionType === "wishlist" || collectionType === "ownedCars"
        ? collectionType
        : null;
    if (!collectionField) return;

    if (!carId || !userId) {
      setActionError("This car cannot be updated right now.");
      return;
    }

    if (!beginAction(`collection:${collectionField}`)) return;

    const userDocRef = doc(db, "users", userId);
    const isInCollection =
      collectionField === "wishlist" ? isInWishlist : isOwned;

    try {
      await updateDoc(userDocRef, {
        [collectionField]: isInCollection
          ? arrayRemove(carId)
          : arrayUnion(carId),
      });

      if (typeof onCollectionUpdate === "function") {
        onCollectionUpdate(carId, collectionField, !isInCollection);
      }
      setActionError(null);
    } catch (e) {
      console.error("Collection update failed:", e);
      setActionError(
        collectionField === "wishlist"
          ? "Couldn't update your wishlist. Check your connection and try again."
          : "Couldn't update your collection. Check your connection and try again."
      );
    } finally {
      finishAction();
    }
  };

  return (
    <div
      className="flex min-w-0 flex-col gap-1.5 h-full w-full"
      aria-busy={Boolean(pendingAction)}
    >
      <div
        className={`card min-w-0 bg-base-300 border border-base-300 ${edgeAccentClass} rounded-xl overflow-hidden transition-transform duration-150 hover:-translate-y-0.5 hover:border-primary/60 w-full flex-grow`}
      >
        <figure className="relative bg-white">
          {imageSrc && !imageFailed ? (
            <img
              src={imageSrc}
              alt={carName}
              className="w-full aspect-[4/3] object-cover"
              decoding="async"
              loading="lazy"
              onError={() => {
                setImageFailed(true);
                setImageSrc(null);
              }}
            />
          ) : (
            <div
              role="img"
              aria-label={`Image unavailable for ${carName}`}
              className="flex aspect-[4/3] items-center justify-center bg-base-200 px-3 text-center text-xs text-base-content/60"
            >
              Image unavailable
            </div>
          )}
          {(isOwned || isInWishlist) && (
            <span
              className={`absolute top-1.5 right-1.5 font-fancy text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                isOwned
                  ? "bg-success/15 text-success border-success/40"
                : "bg-warning/15 text-warning border-warning/40"
              } max-w-[70%] text-right leading-tight whitespace-normal`}
              aria-label={`Collection status: ${collectionStatus}`}
            >
              {collectionStatus}
            </span>
          )}
        </figure>
        <div className="card-body car-card-surface min-w-0 p-2 sm:p-2.5 gap-1.5">
          <h2 className="min-w-0 break-words text-sm font-semibold leading-tight text-base-content">
            <HighlightText text={carName} ranges={nameRanges} />
          </h2>
          <p className="min-w-0 break-words font-fancy text-[9px] uppercase tracking-wide text-base-content/50">
            <HighlightText text={seriesName} ranges={seriesRanges} />
          </p>

          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 mt-0.5">
            <RatingStars value={averageRatingValue} />
            <span className="shrink-0 font-fancy text-[9px] tabular-nums text-base-content/50">
              {averageRating} ({ratingCount})
            </span>
          </div>

          {currentUser && (
            <div
              className="flex flex-col gap-1 mt-1 pt-1.5 border-t border-base-300 min-w-0"
              aria-busy={pendingAction === "rating"}
            >
              <span className="font-fancy text-[9px] uppercase tracking-wide text-base-content/50">
                Your Rating
              </span>
              <div className="flex min-h-11 items-center touch-manipulation">
                <StarRating
                  rating={userRating}
                  onRatingChange={handleSetRating}
                  carId={carId ?? "unknown"}
                  size="sm"
                  readOnly={pendingAction === "rating" || !carId || !userId}
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                <button
                  type="button"
                  onClick={() => handleCollectionToggle("wishlist")}
                  disabled={Boolean(pendingAction) || !carId || !userId}
                  aria-pressed={isInWishlist}
                  className={
                    isInWishlist
                      ? "btn btn-xs min-w-0 min-h-11 sm:min-h-8 h-auto px-1 text-[11px] sm:text-[10px] leading-tight whitespace-normal touch-manipulation btn-warning"
                      : "btn btn-xs min-w-0 min-h-11 sm:min-h-8 h-auto px-1 text-[11px] sm:text-[10px] leading-tight whitespace-normal touch-manipulation btn-outline"
                  }
                >
                  {isInWishlist ? "✓ Wishlist" : "Wishlist"}
                </button>
                <button
                  type="button"
                  onClick={() => handleCollectionToggle("ownedCars")}
                  disabled={Boolean(pendingAction) || !carId || !userId}
                  aria-pressed={isOwned}
                  className={
                    isOwned
                      ? "btn btn-xs min-w-0 min-h-11 sm:min-h-8 h-auto px-1 text-[11px] sm:text-[10px] leading-tight whitespace-normal touch-manipulation btn-success"
                      : "btn btn-xs min-w-0 min-h-11 sm:min-h-8 h-auto px-1 text-[11px] sm:text-[10px] leading-tight whitespace-normal touch-manipulation btn-outline"
                  }
                >
                  {isOwned ? "✓ Owned" : "Owned"}
                </button>
              </div>

              {pendingAction && (
                <span
                  role="status"
                  aria-live="polite"
                  className="text-base-content/50 text-[10px] sm:text-[9px] leading-tight"
                >
                  {pendingAction === "rating"
                    ? "Saving rating…"
                    : "Updating collection…"}
                </span>
              )}

              {actionError && (
                <p role="alert" className="text-error text-[10px] sm:text-[9px] leading-tight mt-0.5">
                  {actionError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 min-h-[18px]">
        {tagEntries.map(({ tag, index }) => (
            <span
              key={`${tag}-${index}`}
              className="min-w-0 max-w-full break-words font-fancy text-[8px] tracking-wide px-1.5 py-0.5 rounded bg-base-200 border border-base-300 text-base-content/60"
            >
              <HighlightText
                text={tag}
                ranges={getMatchRanges(safeMatches, "tags", tag, index)}
              />
            </span>
          ))}
      </div>
    </div>
  );
};

export default Car;
