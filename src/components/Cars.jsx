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
const FILTER_PREVIEW_LIMIT = 4;

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
  const [filterSearch, setFilterSearch] = useState({
    series: "",
    tags: "",
  });
  const [expandedFilterGroups, setExpandedFilterGroups] = useState({
    series: true,
    tags: true,
  });
  const [showAllFilterOptions, setShowAllFilterOptions] = useState({
    series: false,
    tags: false,
  });
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
    setFilterSearch({ series: "", tags: "" });
    setShowAllFilterOptions({ series: false, tags: false });
    setShowFilters(false);
  };

  const activeFilterCount =
    filters.tags.length + filters.series.length;
  const hasActiveFilters =
    activeFilterCount > 0 ||
    searchTerm !== "" ||
    userCollectionFilter !== "all";

  const activeFilterChips = [
    ...filters.series.map((series) => ({
      filterType: "series",
      value: series,
      label: `Series: ${series}`,
    })),
    ...filters.tags.map((tag) => ({
      filterType: "tags",
      value: tag,
      label: `Tag: ${tag}`,
    })),
    ...(userCollectionFilter !== "all"
      ? [
          {
            filterType: "collection",
            value: userCollectionFilter,
            label:
              userCollectionFilter === "owned"
                ? "Owned"
                : "Wishlist",
          },
        ]
      : []),
  ];

  const removeFilter = (filterType, value) => {
    if (filterType === "collection") {
      setUserCollectionFilter("all");
      return;
    }

    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterType]: prevFilters[filterType].filter((item) => item !== value),
    }));
  };

  const matchingFilterOptions = {
    series: uniqueSeries.filter((series) =>
      series.toLowerCase().includes(filterSearch.series.trim().toLowerCase())
    ),
    tags: uniqueTags.filter((tag) =>
      tag.toLowerCase().includes(filterSearch.tags.trim().toLowerCase())
    ),
  };

  const renderFilterGroup = (filterType, title) => {
    const searchValue = filterSearch[filterType];
    const matchingOptions = matchingFilterOptions[filterType];
    const selectedValues = filters[filterType];
    const shouldShowAll =
      showAllFilterOptions[filterType] || searchValue.trim() !== "";
    const visibleOptions = shouldShowAll
      ? matchingOptions
      : matchingOptions.filter(
          (option, index) =>
            index < FILTER_PREVIEW_LIMIT || selectedValues.includes(option)
        );
    const hasMoreOptions =
      searchValue.trim() === "" &&
      matchingOptions.length > FILTER_PREVIEW_LIMIT;
    const optionsId = `${filterType}-filter-options`;
    const isExpanded = expandedFilterGroups[filterType];

    return (
      <section
        key={filterType}
        className="bg-base-200 border border-base-300 rounded-lg"
      >
        <button
          type="button"
          className="flex items-center justify-between gap-3 w-full p-3 text-left"
          aria-expanded={isExpanded}
          aria-controls={optionsId}
          onClick={() =>
            setExpandedFilterGroups((prevGroups) => ({
              ...prevGroups,
              [filterType]: !prevGroups[filterType],
            }))
          }
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="font-semibold">{title}</span>
            {selectedValues.length > 0 && (
              <span className="badge badge-primary badge-sm">
                {selectedValues.length} selected
              </span>
            )}
          </span>
          <span className="font-fancy text-xs text-base-content/60" aria-hidden="true">
            {isExpanded ? "−" : "+"}
          </span>
        </button>

        {isExpanded && (
          <div id={optionsId} className="border-t border-base-300 p-3">
            <label className="form-control mb-3">
              <span className="sr-only">Search {title}</span>
              <input
                type="search"
                value={searchValue}
                onChange={(event) =>
                  setFilterSearch((prevSearch) => ({
                    ...prevSearch,
                    [filterType]: event.target.value,
                  }))
                }
                placeholder={`Search ${title.toLowerCase()}...`}
                className="input input-bordered input-sm w-full"
              />
            </label>

            {matchingOptions.length > 0 ? (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {visibleOptions.map((option) => (
                  <label
                    key={option}
                    className="label cursor-pointer p-0 justify-start gap-2 min-w-0"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm shrink-0"
                      checked={selectedValues.includes(option)}
                      onChange={(event) =>
                        handleFilterChange(
                          filterType,
                          option,
                          event.target.checked
                        )
                      }
                    />
                    <span className="label-text truncate">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-base-content/60 py-2">
                No {title.toLowerCase()} match that search.
              </p>
            )}

            {hasMoreOptions && (
              <button
                type="button"
                className="btn btn-ghost btn-xs mt-3"
                onClick={() =>
                  setShowAllFilterOptions((prevOptions) => ({
                    ...prevOptions,
                    [filterType]: !prevOptions[filterType],
                  }))
                }
              >
                {showAllFilterOptions[filterType]
                  ? "Show fewer"
                  : `Show all ${matchingOptions.length}`}
              </button>
            )}
          </div>
        )}
      </section>
    );
  };

  const goToPage = (page) => {
    const clamped = Math.min(Math.max(page, 1), totalPages);
    if (clamped === currentPage) return;
    setCurrentPage(clamped);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div ref={topRef} />
      <div className="w-full mb-5 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
          CarsDB Catalog
        </h1>
        <p className="text-sm sm:text-base text-base-content/60 mt-1">
          Browse, rate, and track your collection.
        </p>
      </div>
      {/* ### START CONTROLS BAR ### */}
      <div className="w-full bg-base-200 border border-base-300 p-4 rounded-box shadow-lg mb-6 sm:mb-8">
        {/* Top row of controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 items-end gap-3">
          {/* Search Input leads the catalog workflow */}
          <div className="form-control sm:col-span-2 md:col-span-3">
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
          <div className="form-control">
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
          <div className="form-control">
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

          {/* Filter Toggle Button */}
          <div className="form-control">
            <label className="label sm:invisible" aria-hidden="true">
              <span className="label-text">Filters</span>
            </label>
            <button
              type="button"
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
        </div>

        <div
          className="mt-4 pt-4 border-t border-base-300 flex flex-col gap-3"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-base-content/70">
              Showing <span className="font-semibold text-base-content">{sortedCars.length}</span>{" "}
              {sortedCars.length === 1 ? "car" : "cars"}
            </p>
            {activeFilterChips.length > 0 && (
              <span className="font-fancy text-xs uppercase tracking-wide text-base-content/50">
                {activeFilterChips.length} active {activeFilterChips.length === 1 ? "filter" : "filters"}
              </span>
            )}
          </div>

          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilterChips.map((chip) => (
                <button
                  key={`${chip.filterType}-${chip.value}`}
                  type="button"
                  className="badge badge-outline gap-1 py-3 max-w-full h-auto min-h-6 whitespace-normal text-left"
                  aria-label={`Remove ${chip.label} filter`}
                  onClick={() => removeFilter(chip.filterType, chip.value)}
                >
                  {chip.label}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* --- START EXPANDABLE FILTER AREA --- */}
        {showFilters && (
          <div className="mt-6 pt-4 border-t border-base-300 space-y-3">
            <div>
              <h3 className="font-semibold">Refine catalog</h3>
              <p className="text-sm text-base-content/60">
                Narrow the catalog by Series or Tags.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-3">
              {renderFilterGroup("series", "Series")}
              {uniqueTags.length > 0 && renderFilterGroup("tags", "Tags")}
            </div>
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
        <div className="w-full max-w-full overflow-x-auto flex justify-center pb-1 mb-6 sm:mb-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      )}

      {/* CARS GRID */}
      {currentCars.length > 0 ? (
        <div className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-6">
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
        <div className="w-full max-w-prose text-center text-base-content/60 py-10 px-4">
          <p>
            No cars match your criteria.
            {didYouMean && (
              <>
                {" "}
                Did you mean{" "}
                <button
                  className="link link-primary break-words"
                  onClick={() => setSearchTerm(didYouMean)}
                >
                  {didYouMean}
                </button>
                ?
              </>
            )}
          </p>
        </div>
      )}

      {/* PAGINATION (BOTTOM) */}
      {totalPages > 1 && (
        <div className="w-full max-w-full overflow-x-auto flex justify-center pb-1 mt-8">
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
