import { useState, useEffect } from "react";
import Car from "./Car";

const Cars = ({ cars, currentUser, onRatingUpdate, onCollectionUpdate }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  const sortedCars = [...cars].sort((a, b) => {
    if (sortDirection === "asc") {
      return a.name.localeCompare(b.name);
    } else {
      return b.name.localeCompare(a.name);
    }
  });

  const filteredCars = sortedCars.filter((car) =>
    car.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const carsPerPage = 24;
  const lastCarIndex = currentPage * carsPerPage;
  const firstCarIndex = lastCarIndex - carsPerPage;
  const currentCars = filteredCars.slice(firstCarIndex, lastCarIndex);
  const totalPages = Math.ceil(filteredCars.length / carsPerPage) || 1;

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
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="form-control w-full max-w-xs">
          <input
            type="text"
            placeholder="Search by car name..."
            className="input input-bordered w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

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
    </div>
  );
};

export default Cars;
