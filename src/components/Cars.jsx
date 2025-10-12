import { useState, useEffect } from "react";
import Car from "./Car";

const Cars = ({ cars }) => {
  // 1. State for managing page, search, and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState("asc"); // Default to A-Z

  // 2. Sorting Logic (runs first)
  const sortedCars = [...cars].sort((a, b) => {
    if (sortDirection === "asc") {
      return a.name.localeCompare(b.name); // A-Z
    } else {
      return b.name.localeCompare(a.name); // Z-A
    }
  });

  // 3. Filtering Logic (runs on the sorted list)
  const filteredCars = sortedCars.filter((car) =>
    car.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 4. Pagination Logic (runs on the final filtered list)
  const carsPerPage = 24;
  const lastCarIndex = currentPage * carsPerPage;
  const firstCarIndex = lastCarIndex - carsPerPage;
  const currentCars = filteredCars.slice(firstCarIndex, lastCarIndex);
  const totalPages = Math.ceil(filteredCars.length / carsPerPage) || 1;

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
      {/* Controls Container */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Search Input Field */}
        <div className="form-control w-full max-w-xs">
          <input
            type="text"
            placeholder="Search by car name..."
            className="input input-bordered w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Sorting Buttons */}
        <div className="btn-group">
          <button
            className="btn"
            onClick={() => setSortDirection("asc")}
            disabled={sortDirection === "asc"}
          >
            Sort A-Z
          </button>
          <button
            className="btn"
            onClick={() => setSortDirection("desc")}
            disabled={sortDirection === "desc"}
          >
            Sort Z-A
          </button>
        </div>
      </div>

      {/* Container for the car cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-6">
        {currentCars.map((car) => (
          <Car key={car.id} car={car} />
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="join">
        <button className="join-item btn" onClick={handlePrevPage} disabled={currentPage === 1}>
          «
        </button>
        <button className="join-item btn">
          Page {currentPage} of {totalPages}
        </button>
        <button className="join-item btn" onClick={handleNextPage} disabled={currentPage === totalPages}>
          »
        </button>
      </div>
    </div>
  );
};

export default Cars;