import { useState, useEffect, useRef } from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(currentPage));
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(currentPage));
    }
  }, [currentPage, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commitPage = () => {
    const parsed = parseInt(inputValue, 10);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.min(Math.max(parsed, 1), totalPages);
      onPageChange(clamped);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      commitPage();
    } else if (e.key === "Escape") {
      setInputValue(String(currentPage));
      setIsEditing(false);
    }
  };

  return (
    <div className="join">
      <button
        className="join-item btn"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        aria-label="First page"
      >
        «
      </button>
      <button
        className="join-item btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        ‹
      </button>
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          min={1}
          max={totalPages}
          className="join-item input input-bordered w-24 text-center"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={commitPage}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <button
          className="join-item btn"
          onClick={() => setIsEditing(true)}
          title="Click to jump to a page"
        >
          Page {currentPage} of {totalPages}
        </button>
      )}
      <button
        className="join-item btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        ›
      </button>
      <button
        className="join-item btn"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        aria-label="Last page"
      >
        »
      </button>
    </div>
  );
};

export default Pagination;
