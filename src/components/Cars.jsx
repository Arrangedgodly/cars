import { useState, useEffect, useMemo, useRef } from "react";
import Fuse from "fuse.js";
import Car from "./Car";
import Pagination from "./Pagination";

const FUSE_KEYS = [
  { name: "name", weight: 0.6 },
  { name: "tags", weight: 0.25 },
  { name: "series", weight: 0.15 },
];

const TIGHT_FUSE_OPTIONS = {
  keys: FUSE_KEYS,
  includeScore: true,
  includeMatches: true,
  ignoreLocation: true,
  threshold: 0.3,
};

const LOOSE_FUSE_OPTIONS = { ...TIGHT_FUSE_OPTIONS, threshold: 0.6 };

const DID_YOU_MEAN_SCORE_CUTOFF = 0.45;

// Runs each whitespace-separated word as its own fuzzy search across all
// weighted keys, then keeps only cars that matched every word (AND across
// words, OR across fields) so multi-word queries like "lightning cars" work.
const searchAllTokens = (fuseInstance, term) => {
  const tokens = term.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const perTokenResults = tokens.map((token) => {
    const map = new Map();
    fuseInstance.search(token).forEach((result) => {
      map.set(result.item.id, result);
    });
    return map;
  });

  const [firstMap, ...restMaps] = perTokenResults;
  const combined = [];

  firstMap.forEach((firstResult, id) => {
    const matchingResults = [firstResult];
    const isInAll = restMaps.every((map) => {
      const result = map.get(id);
      if (result) matchingResults.push(result);
      return Boolean(result);
    });
    if (!isInAll) return;

    const score =
      matchingResults.reduce((sum, result) => sum + (result.score ?? 0), 0) /
      matchingResults.length;
    const matches = matchingResults.flatMap((result) => result.matches ?? []);
    combined.push({ item: firstResult.item, score, matches });
  });

  return combined.sort((a, b) => a.score - b.score);
};

const Cars = ({ cars, currentUser, onRatingUpdate, onCollectionUpdate }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [filters, setFilters] = useState({
    tags: [],
    series: [],
  });
  const [userCollectionFilter, setUserCollectionFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const topRef = useRef(null);

  const uniqueTags = [...new Set(cars.flatMap((car) => car.tags || []))].sort();
  const uniqueSeries = [
    ...new Set(cars.flatMap((car) => car.series || [])),
  ].sort();

  const scopedCars = useMemo(() => {
    return cars.filter((car) => {
      const carTags = car.tags || [];
      const carSeries = car.series || "";

      const matchesSeries =
        filters.series.length === 0
          ? true
          : filters.series.includes(carSeries);
      const matchesTag =
        filters.tags.length === 0
          ? true
          : carTags.some((tag) => filters.tags.includes(tag));

      const matchesUserCollection = () => {
        if (!currentUser) return true;
        if (userCollectionFilter === "owned") {
          return currentUser.ownedCars?.includes(car.id);
        }
        if (userCollectionFilter === "wishlist") {
          return currentUser.wishlist?.includes(car.id);
        }
        return true;
      };

      return matchesSeries && matchesTag && matchesUserCollection();
    });
  }, [cars, filters, userCollectionFilter, currentUser]);

  const tightFuse = useMemo(
    () => new Fuse(scopedCars, TIGHT_FUSE_OPTIONS),
    [scopedCars]
  );
  const looseFuse = useMemo(
    () => new Fuse(scopedCars, LOOSE_FUSE_OPTIONS),
    [scopedCars]
  );

  const trimmedSearch = searchTerm.trim();
  let sortedCars;
  let matchesById = new Map();
  let didYouMean = null;

  if (trimmedSearch === "") {
    sortedCars = [...scopedCars].sort((a, b) => {
      const [field, direction] = sortBy.split("-");

      if (field === "rating") {
        const getAvg = (car) =>
          car.ratingCount > 0 ? car.totalRatingScore / car.ratingCount : 0;
        const ratingA = getAvg(a);
        const ratingB = getAvg(b);
        return direction === "asc" ? ratingA - ratingB : ratingB - ratingA;
      }

      if (direction === "asc") {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });
  } else {
    const tightResults = searchAllTokens(tightFuse, trimmedSearch);
    if (tightResults.length > 0) {
      sortedCars = tightResults.map((result) => result.item);
      tightResults.forEach((result) =>
        matchesById.set(result.item.id, result.matches)
      );
    } else {
      sortedCars = [];
      const looseResults = searchAllTokens(looseFuse, trimmedSearch);
      if (
        looseResults.length > 0 &&
        looseResults[0].score <= DID_YOU_MEAN_SCORE_CUTOFF
      ) {
        didYouMean = looseResults[0].item.name;
      }
    }
  }

  const carsPerPage = 24;
  const lastCarIndex = currentPage * carsPerPage;
  const firstCarIndex = lastCarIndex - carsPerPage;
  const currentCars = sortedCars.slice(firstCarIndex, lastCarIndex);
  const totalPages = Math.ceil(sortedCars.length / carsPerPage) || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortBy, userCollectionFilter]);

  const handleFilterChange = (filterType, value, isChecked) => {
    setFilters((prevFilters) => {
      const currentValues = prevFilters[filterType];
      let newValues = [];

      if (isChecked) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues.filter((item) => item !== value);
      }

      return {
        ...prevFilters,
        [filterType]: newValues,
      };
    });
  };

  const clearFilters = () => {
    setFilters({ tags: [], series: [] });
    setSearchTerm("");
    setSortBy("name-asc");
    setUserCollectionFilter("all");
    setShowFilters(false);
  };

  const activeFilterCount =
    filters.tags.length + filters.series.length;
  const hasActiveFilters =
    activeFilterCount > 0 ||
    searchTerm !== "" ||
    userCollectionFilter !== "all";

  const goToPage = (page) => {
    const clamped = Math.min(Math.max(page, 1), totalPages);
    if (clamped === currentPage) return;
    setCurrentPage(clamped);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div ref={topRef} />
      {/* ### START CONTROLS BAR ### */}
      <div className="w-full bg-base-200 border border-base-300 p-4 rounded-box shadow-lg mb-6 sm:mb-8">
        {/* Top row of controls */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center items-center sm:items-end gap-2">
          {/* Filter Toggle Button */}
          <div className="form-control w-30 max-w-xs text-sm">
            <button
              className={`btn w-full ${showFilters ? "btn-primary" : "btn-outline"}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Hide" : "Filters"}
              {activeFilterCount > 0 && (
                <div className="badge badge-secondary ml-2">
                  {activeFilterCount}
                </div>
              )}
            </button>
          </div>
          
          {/* Search Input */}
          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">Search</span>
            </label>
            <input
              type="text"
              placeholder="Search by name, series, tag..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sort Dropdown */}
          <div className="form-control w-30 max-w-xs">
            <label className="label">
              <span className="label-text">Sort By</span>
            </label>
            <select
              className="select select-bordered"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="rating-desc">Rating (High to Low)</option>
              <option value="rating-asc">Rating (Low to High)</option>
            </select>
          </div>

          {/* User Collection Filter */}
          <div className="form-control w-30 max-w-xs">
            <label className="label">
              <span className="label-text">Show</span>
            </label>
            <select
              className="select select-bordered"
              value={userCollectionFilter}
              onChange={(e) => setUserCollectionFilter(e.target.value)}
              disabled={!currentUser}
            >
              <option value="all">All Cars</option>
              <option value="owned">My Owned</option>
              <option value="wishlist">My Wishlist</option>
            </select>
          </div>
        </div>

        {/* --- START EXPANDABLE FILTER AREA --- */}
        {showFilters && (
          <div className="mt-6 pt-4 border-t border-base-300">
            {/* Series Filters */}
            <h4 className="font-semibold mb-2">Series</h4>
            <div className="bg-base-200 p-4 rounded-lg max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {uniqueSeries.map((series) => (
                <label
                  key={series}
                  className="label cursor-pointer p-0 justify-start gap-2"
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={filters.series.includes(series)}
                    onChange={(e) =>
                      handleFilterChange("series", series, e.target.checked)
                    }
                  />
                  <span className="label-text truncate">{series}</span>
                </label>
              ))}
            </div>

            {/* Tag Filters */}
            {uniqueTags.length > 0 && (
              <>
                <h4 className="font-semibold mt-4 mb-2">Tags</h4>
                <div className="bg-base-200 p-4 rounded-lg max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {uniqueTags.map((tag) => (
                    <label
                      key={tag}
                      className="label cursor-pointer p-0 justify-start gap-2"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={filters.tags.includes(tag)}
                        onChange={(e) =>
                          handleFilterChange("tags", tag, e.target.checked)
                        }
                      />
                      <span className="label-text truncate">{tag}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {/* --- END EXPANDABLE FILTER AREA --- */}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="text-center mt-4 pt-4 border-t border-base-300">
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
              Clear All Filters & Search
            </button>
          </div>
        )}
      </div>
      {/* ### END CONTROLS BAR ### */}

      {/* PAGINATION (TOP) */}
      {totalPages > 1 && (
        <div className="mb-6 sm:mb-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      )}

      {/* CARS GRID */}
      {currentCars.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {currentCars.map((car) => (
            <Car
              key={car.id}
              car={car}
              currentUser={currentUser}
              onRatingUpdate={onRatingUpdate}
              onCollectionUpdate={onCollectionUpdate}
              matches={matchesById.get(car.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-base-content/60 py-8">
          No cars match your criteria.
          {didYouMean && (
            <>
              {" "}
              Did you mean{" "}
              <button
                className="link link-primary"
                onClick={() => setSearchTerm(didYouMean)}
              >
                {didYouMean}
              </button>
              ?
            </>
          )}
        </p>
      )}

      {/* PAGINATION (BOTTOM) */}
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      )}
    </div>
  );
};

export default Cars;