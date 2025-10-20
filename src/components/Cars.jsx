import { useState, useEffect } from "react";
import Car from "./Car";

const Cars = ({ cars, currentUser, onRatingUpdate, onCollectionUpdate }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  // State now only tracks name sorting
  const [sortBy, setSortBy] = useState("name-asc");
  // New state to hold all filters
  const [filters, setFilters] = useState({
    tag: null,
    series: null,
  });

  // Derive unique tags and series from the car list
  const uniqueTags = [...new Set(cars.flatMap((car) => car.tags || []))].sort();
  const uniqueSeries = [
    ...new Set(cars.flatMap((car) => car.series || [])),
  ].sort();

  // 1. Filter the cars based on search and filters state
  const filteredCars = cars.filter((car) => {
    const term = searchTerm.toLowerCase();
    const carTags = car.tags || [];
    const carSeries = car.series || "";

    // Search term logic (matches name, series, or any tag)
    const matchesSearch =
      searchTerm === ""
        ? true
        : car.name.toLowerCase().includes(term) ||
          car.series.toLowerCase().includes(term) ||
          carTags.some((tag) => tag.toLowerCase().includes(term));

    // Filter logic
    const matchesTag = filters.tag ? carTags.includes(filters.tag) : true;
    const matchesSeries = filters.series ? carSeries === filters.series : true;

    return matchesSearch && matchesTag && matchesSeries;
  });

  // 2. Sort the *filtered* list (Simplified)
  const sortedCars = [...filteredCars].sort((a, b) => {
    const direction = sortBy.split("-")[1];

    if (direction === "asc") {
      return a.name.localeCompare(b.name);
    } else {
      return b.name.localeCompare(a.name);
    }
  });

  // 3. Paginate the *sorted* list
  const carsPerPage = 24;
  const lastCarIndex = currentPage * carsPerPage;
  const firstCarIndex = lastCarIndex - carsPerPage;
  const currentCars = sortedCars.slice(firstCarIndex, lastCarIndex);
  const totalPages = Math.ceil(sortedCars.length / carsPerPage) || 1;

  // Reset to page 1 if search, filters, or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortBy]);

  const handleFilterChange = (filterType, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterType]: value || null, // Set to null if value is empty string
    }));
  };

  const clearFilters = () => {
    setFilters({ tag: null, series: null });
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="flex flex-col items-center w-full gap-8">
      {/* CONTROLS BAR */}
      <div className="flex flex-wrap items-end justify-center gap-4 w-full">
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

        {/* Sort Dropdown (Simplified) */}
        <div className="form-control w-full max-w-xs">
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
          </select>
        </div>

        {/* Filter Dropdown */}
        <div className="form-control">
          <label className="label">
            <span className="label-text invisible">Filters</span>
          </label>
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn m-1">
              Filters
              {(filters.tag || filters.series) && (
                <div className="badge badge-secondary ml-2">!</div>
              )}
            </label>
            <div
              tabIndex={0}
              className="dropdown-content z-[1] menu p-4 shadow bg-base-300 rounded-box w-72"
            >
              {/* Series Filter */}
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text">Filter by Series</span>
                </label>
                <select
                  className="select select-bordered"
                  value={filters.series || ""}
                  onChange={(e) => handleFilterChange("series", e.target.value)}
                >
                  <option value="">All Series</option>
                  {uniqueSeries.map((series) => (
                    <option key={series} value={series}>
                      {series}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tag Filter */}
              {uniqueTags.length > 0 && (
                <div className="form-control w-full mb-4">
                  <label className="label">
                    <span className="label-text">Filter by Tag</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={filters.tag || ""}
                    onChange={(e) => handleFilterChange("tag", e.target.value)}
                  >
                    <option value="">All Tags</option>
                    {uniqueTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Clear Filters Button */}
              <button
                className="btn btn-ghost btn-sm mt-2"
                onClick={clearFilters}
                disabled={!filters.tag && !filters.series}
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      </div>

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
            />
          ))}
        </div>
      ) : (
        <p>No cars match your criteria.</p>
      )}

      {/* PAGINATION */}
      {currentCars.length > 0 && (
        <div className="join">
          <button
            className="join-item btn"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            «
          </button>
          <button className="join-item btn">
            Page {currentPage} of {totalPages}
          </button>
          <button
            className="join-item btn"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            »
          </button>
        </div>
      )}
    </div>
  );
};

export default Cars;