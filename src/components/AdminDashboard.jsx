import { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  writeBatch,
  arrayUnion,
} from "firebase/firestore";

const seriesOptions = [
  "Cars",
  "Cars Toon",
  "Cars 2",
  "Planes",
  "Planes: Fire and Rescue",
  "Cars 3",
  "Cars on the Road",
  "Mater and the Ghostlight",
  "Mater and the Easter Buggy",
  "Silver Racer",
  "Neon Racers",
  "Ice Racers",
  "Carbon Racers",
  "Carnival Cup",
  "Mud Racing",
  "Rocket Racing",
  "Drag Racing",
  "World of Cars",
  "Mater Saves Christmas",
  "Vitaminamulch: Air Spectacular",
  "Road Trip",
  "Thomasville Racing Legends",
  "Fireball Beach Racers",
  "Fan Favorites",
  "RS 24h Endurance Race",
  "Racing Red",
  "NASCAR",
  "Disney 100",
  "Glow Racers",
  "Global Racers Cup",
  "Race & Rescue"
];

const getCarId = (car) =>
  car?.id == null || String(car.id).trim() === ""
    ? null
    : String(car.id).trim();

const getCarName = (car) =>
  typeof car?.name === "string" && car.name.trim() ? car.name : "Unnamed car";

const getCarSeries = (car) =>
  typeof car?.series === "string" && car.series.trim()
    ? car.series
    : "Uncategorized";

const getCarTags = (car) =>
  Array.isArray(car?.tags)
    ? car.tags.filter((tag) => typeof tag === "string" && tag.trim())
    : [];

const getCarImage = (car) => {
  const image = car?.cloudinary?.secure_url ?? car?.image;
  return typeof image === "string" && image.trim() ? image : null;
};

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const AdminDashboard = ({
  db,
  isAdmin,
  cars,
  onCarAdded,
  onCarUpdated,
  onCarsTagged,
}) => {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [series, setSeries] = useState(seriesOptions[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");

  // State for new filters
  const [filters, setFilters] = useState({
    tag: null,
    series: null,
  });

  const [tagInput, setTagInput] = useState("");
  const [selectedCars, setSelectedCars] = useState([]);
  const [isSavingTags, setIsSavingTags] = useState(false);
  const [isUpdatingCar, setIsUpdatingCar] = useState(false);
  const [editError, setEditError] = useState("");

  const [editingCar, setEditingCar] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    series: "",
    image: "",
  });
  const messageTimerRef = useRef(null);
  const editDialogRef = useRef(null);

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, []);

  const showMessage = (nextMessage) => {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    setMessage(nextMessage);

    if (nextMessage.text) {
      messageTimerRef.current = setTimeout(() => {
        setMessage({ type: "", text: "" });
        messageTimerRef.current = null;
      }, 5000);
    }
  };

  // Unique values for filter dropdowns
  const safeCars = Array.isArray(cars)
    ? cars.filter((car) => getCarId(car))
    : [];
  const uniqueTags = [
    ...new Set(safeCars.flatMap((car) => getCarTags(car))),
  ].sort((a, b) => a.localeCompare(b));
  const uniqueSeries = [
    ...new Set(safeCars.map((car) => getCarSeries(car))),
  ].sort((a, b) => a.localeCompare(b));

  const handleFilterChange = (filterType, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterType]: value || null,
    }));
  };

  const handleCarSelection = (carId) => {
    if (!carId) return;

    setSelectedCars((prevSelected) => {
      if (prevSelected.includes(carId)) {
        return prevSelected.filter((id) => id !== carId);
      } else {
        return [...prevSelected, carId];
      }
    });
  };

  const handleSaveTags = async () => {
    const trimmedTag = tagInput.trim();
    if (!trimmedTag || selectedCars.length === 0) {
      showMessage({
        type: "error",
        text: "Please enter a tag and select at least one car.",
      });
      return;
    }

    setIsSavingTags(true);
    showMessage({ type: "", text: "" });

    try {
      const batch = writeBatch(db);
      selectedCars.forEach((carId) => {
        const carDocRef = doc(db, "cars", carId);
        batch.update(carDocRef, { tags: arrayUnion(trimmedTag) });
      });
      await batch.commit();
      onCarsTagged?.(selectedCars, trimmedTag);
      showMessage({
        type: "success",
        text: `Added "${trimmedTag}" to ${selectedCars.length} cars.`,
      });
      setSelectedCars([]);
      setTagInput("");
    } catch (error) {
      console.error("Error saving tags:", error);
      showMessage({
        type: "error",
        text: "Couldn’t save this tag. Check your connection or permissions and try again.",
      });
    } finally {
      setIsSavingTags(false);
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      showMessage({
        type: "error",
        text: "You are not authorized to perform this action.",
      });
      return;
    }
    const trimmedName = name.trim();
    const trimmedImage = image.trim();
    if (!trimmedName || !trimmedImage || !series) {
      showMessage({ type: "error", text: "Complete the car name, image URL, and series." });
      return;
    }
    if (!isHttpUrl(trimmedImage)) {
      showMessage({
        type: "error",
        text: "Enter a valid http or https image URL.",
      });
      return;
    }

    setIsSubmitting(true);
    showMessage({ type: "", text: "" });

    try {
      const carsCollectionRef = collection(db, "cars");
      const newCarData = { name: trimmedName, image: trimmedImage, series };
      const docRef = await addDoc(carsCollectionRef, newCarData);
      onCarAdded?.({ id: docRef.id, ...newCarData });
      showMessage({ type: "success", text: `Added "${trimmedName}" to the database.` });
      setName("");
      setImage("");
      setSeries(seriesOptions[0]);
    } catch (error) {
      console.error("Error adding car:", error);
      showMessage({
        type: "error",
        text: "Couldn’t add this car. Check your connection or permissions and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (car) => {
    setEditingCar(car);
    setEditFormData({
      name: typeof car?.name === "string" ? car.name : "",
      series: typeof car?.series === "string" ? car.series : "",
      image: getCarImage(car) ?? "",
    });
    setEditError("");
    if (editDialogRef.current && !editDialogRef.current.open) {
      editDialogRef.current.showModal();
    }
  };

  const handleUpdateCar = async (e) => {
    e.preventDefault();
    const editingCarId = getCarId(editingCar);
    if (!isAdmin || !editingCarId) {
      setEditError("You do not have permission to update this car.");
      return;
    }

    const trimmedName = editFormData.name.trim();
    const trimmedImage = editFormData.image.trim();
    if (!trimmedName || !trimmedImage || !editFormData.series) {
      setEditError("Complete the car name, image URL, and series.");
      return;
    }
    if (!isHttpUrl(trimmedImage)) {
      setEditError("Enter a valid http or https image URL.");
      return;
    }

    setIsUpdatingCar(true);
    setEditError("");

    try {
      const carDocRef = doc(db, "cars", editingCarId);
      const updatedCar = {
        name: trimmedName,
        image: trimmedImage,
        series: editFormData.series,
      };
      await updateDoc(carDocRef, updatedCar);
      onCarUpdated?.({ ...editingCar, id: editingCarId, ...updatedCar });
      editDialogRef.current?.close();
      showMessage({ type: "success", text: `Updated "${trimmedName}".` });
    } catch (error) {
      console.error("Error updating car:", error);
      setEditError(
        "Couldn’t update this car. Check your connection or permissions and try again."
      );
    } finally {
      setIsUpdatingCar(false);
    }
  };

  const sortedAndFilteredCars = [...safeCars]
    .filter((car) => {
      const term = searchTerm.trim().toLowerCase();
      const carName = getCarName(car);
      const carSeries = getCarSeries(car);
      const carTags = getCarTags(car);

      const matchesSearch =
        term === ""
          ? true
          : carName.toLowerCase().includes(term) ||
            carSeries.toLowerCase().includes(term) ||
            carTags.some((tag) => tag.toLowerCase().includes(term));

      const matchesTag = filters.tag ? carTags.includes(filters.tag) : true;
      const matchesSeries = filters.series
        ? carSeries === filters.series
        : true;

      return matchesSearch && matchesTag && matchesSeries;
    })
    .sort((a, b) => {
      const [field, direction] = sortBy.split("-");
      const valA = field === "series" ? getCarSeries(a) : getCarName(a);
      const valB = field === "series" ? getCarSeries(b) : getCarName(b);

      if (direction === "asc") {
        return valA.localeCompare(valB);
      } else {
        return valB.localeCompare(valA);
      }
    });

  return (
    <div className="bg-base-300 border border-base-content/10 rounded-box shadow-xl p-6 sm:p-8 w-full">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
          Admin Dashboard
        </h1>
        <p className="text-base-content/60 mt-1">
          Maintain the shared catalog and collector tags.
        </p>
      </div>
      {message.text && (
        <div
          role={message.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`mb-6 p-3 rounded-md ${
            message.type === "success"
              ? "bg-success/15 text-success border border-success/30"
              : "bg-error/15 text-error border border-error/30"
          }`}
        >
          {message.text}
        </div>
      )}
      <div className="border-t border-base-content/10 pt-6">
        <h2 className="text-xl font-semibold mb-4">Add a New Car</h2>
        <form onSubmit={handleAddCar} className="grid gap-4 sm:grid-cols-2">
          <div className="form-control">
            <label className="label" htmlFor="new-car-name">
              <span className="label-text">Car name</span>
            </label>
            <input
              id="new-car-name"
              type="text"
              placeholder="e.g., Lightning McQueen"
              maxLength={120}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>
          <div className="form-control">
            <label className="label" htmlFor="new-car-image">
              <span className="label-text">Image URL</span>
            </label>
            <input
              id="new-car-image"
              type="url"
              placeholder="https://…"
              maxLength={2048}
              required
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>
          <div className="form-control sm:col-span-2">
            <div className="label" id="new-series-label">
              <span className="label-text font-semibold">Series</span>
            </div>
            <div
              role="group"
              className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-3 bg-base-100 border border-base-content/10 rounded-lg"
              aria-labelledby="new-series-label"
            >
              {seriesOptions.map((option) => (
                <label
                  className="label min-h-11 cursor-pointer justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-base-200 focus-within:bg-base-200"
                  key={option}
                >
                  <span className="label-text min-w-0 break-words">{option}</span>
                  <input
                    type="radio"
                    name="series-toggle"
                    className="radio radio-primary shrink-0"
                    value={option}
                    checked={series === option}
                    onChange={(e) => setSeries(e.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-gradient-primary w-full sm:col-span-2 mt-1"
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner" aria-hidden="true"></span>
                Adding car…
              </>
            ) : (
              "Add Car to Database"
            )}
          </button>
        </form>
      </div>
      <div className="border-t border-base-content/10 pt-6 mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <h2 className="text-xl font-semibold">Current Car Database</h2>
          <span className="font-fancy text-xs text-base-content/60">
            {sortedAndFilteredCars.length} matching cars
          </span>
        </div>
        <div className="bg-base-100 border border-base-content/10 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-1">Tagging Tool</h3>
          <p className="text-sm text-base-content/60 mb-4">
            Enter a tag, select cars, then save it to the batch.
          </p>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
            <div className="form-control min-w-0">
              <label className="label" htmlFor="tag-input">
                <span className="label-text">New tag</span>
              </label>
              <input
                id="tag-input"
                type="text"
                placeholder="e.g., Racecar, Exclusive"
                maxLength={80}
                className="input input-bordered w-full"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary btn-gradient-primary w-full sm:w-auto"
              onClick={handleSaveTags}
              disabled={isSavingTags || !tagInput.trim() || selectedCars.length === 0}
            >
              {isSavingTags ? (
                <>
                  <span className="loading loading-spinner" aria-hidden="true"></span>
                  Saving…
                </>
              ) : (
                `Save to ${selectedCars.length} cars`
              )}
            </button>
            <button
              type="button"
              className="btn btn-ghost w-full sm:w-auto"
              onClick={() => setSelectedCars([])}
              disabled={selectedCars.length === 0}
            >
              Clear selection
            </button>
          </div>
        </div>
        {/* --- CONTROLS BAR --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6 bg-base-100 border border-base-content/10 p-4 rounded-lg">
          <div className="form-control min-w-0">
            <label className="label" htmlFor="admin-search">
              <span className="label-text">Search</span>
            </label>
            <input
              id="admin-search"
              type="search"
              placeholder="Search names, series, or tags…"
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-control min-w-0">
            <label className="label" htmlFor="admin-sort">
              <span className="label-text">Sort by</span>
            </label>
            <select
              id="admin-sort"
              className="select select-bordered w-full"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="series-asc">Series (A–Z)</option>
              <option value="series-desc">Series (Z–A)</option>
            </select>
          </div>
          <div className="form-control min-w-0">
            <label className="label" htmlFor="admin-series-filter">
              <span className="label-text">Filter by series</span>
            </label>
            <select
              id="admin-series-filter"
              className="select select-bordered w-full"
              value={filters.series || ""}
              onChange={(e) => handleFilterChange("series", e.target.value)}
            >
              <option value="">All series</option>
              {uniqueSeries.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="form-control min-w-0">
            <label className="label" htmlFor="admin-tag-filter">
              <span className="label-text">Filter by tag</span>
            </label>
            <select
              id="admin-tag-filter"
              className="select select-bordered w-full"
              value={filters.tag || ""}
              onChange={(e) => handleFilterChange("tag", e.target.value)}
            >
              <option value="">All tags</option>
              {uniqueTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        {sortedAndFilteredCars.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
            {sortedAndFilteredCars.map((car) => {
              const carId = getCarId(car);
              const carName = getCarName(car);
              const carSeries = getCarSeries(car);
              const carImage = getCarImage(car);
              const isSelected = selectedCars.includes(carId);
              return (
                <div key={carId} className="flex min-w-0 flex-col">
                  <div
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-label={`${isSelected ? "Deselect" : "Select"} ${carName}`}
                    tabIndex={0}
                    onClick={() => handleCarSelection(carId)}
                    onKeyDown={(e) => {
                      if (
                        e.target === e.currentTarget &&
                        (e.key === "Enter" || e.key === " ")
                      ) {
                        e.preventDefault();
                        handleCarSelection(carId);
                      }
                    }}
                    className={`bg-base-100 p-2 rounded-lg flex min-w-0 items-center gap-3 tooltip tooltip-primary cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 w-full ${
                      isSelected ? "ring-2 ring-accent" : "ring-0"
                    }`}
                    data-tip={carName}
                    title={carName}
                  >
                    <div className="avatar">
                      <div className="w-12 rounded">
                        {carImage ? (
                          <img
                            src={carImage}
                            alt={carName}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.src = "/carsdb.svg";
                              e.currentTarget.alt = "Image unavailable";
                              e.currentTarget.className = "object-contain p-2";
                            }}
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center bg-base-200 text-center text-xs leading-tight text-base-content/60">
                            No image
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-grow overflow-hidden">
                      <p className="break-words text-sm font-bold leading-tight">
                        {carName}
                      </p>
                      <p className="break-words text-xs text-base-content/60 leading-tight mt-1">
                        {carSeries}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(car);
                      }}
                      className="btn btn-sm btn-ghost min-h-11 min-w-11 shrink-0 px-2"
                      aria-label={`Edit ${carName}`}
                    >
                      Edit
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-1.5 w-full min-h-[22px]">
                    {getCarTags(car).map((tag, index) => (
                      <div
                        key={`${tag}-${index}`}
                        className="badge badge-ghost badge-xs max-w-full whitespace-normal break-words text-left"
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-base-content/20 rounded-lg px-4 py-10 text-center text-base-content/60">
            <p>No cars match these filters.</p>
            <button
              type="button"
              className="btn btn-ghost btn-sm mt-3"
              onClick={() => {
                setSearchTerm("");
                setFilters({ tag: null, series: null });
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      <dialog
        ref={editDialogRef}
        id="edit_car_modal"
        className="modal"
        aria-labelledby="edit-car-title"
        onClose={() => {
          setEditingCar(null);
          setEditError("");
          setIsUpdatingCar(false);
        }}
      >
        <div className="modal-box max-w-2xl">
          <h3 id="edit-car-title" className="font-bold text-lg">
            Edit Car: {getCarName(editingCar)}
          </h3>
          <form onSubmit={handleUpdateCar} className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="form-control w-full">
              <label className="label" htmlFor="edit-name">
                <span className="label-text">Car name</span>
              </label>
              <input
                id="edit-name"
                type="text"
                maxLength={120}
                required
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="input input-bordered w-full"
              />
            </div>
            <div className="form-control w-full">
              <label className="label" htmlFor="edit-image">
                <span className="label-text">Image URL</span>
              </label>
              <input
                id="edit-image"
                type="url"
                maxLength={2048}
                required
                value={editFormData.image}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, image: e.target.value }))
                }
                className="input input-bordered w-full"
              />
            </div>
            <div className="form-control w-full sm:col-span-2">
              <div className="label" id="edit-series-label">
                <span className="label-text font-semibold">Series</span>
              </div>
              <div
                role="group"
                className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-3 bg-base-100 border border-base-content/10 rounded-lg"
                aria-labelledby="edit-series-label"
              >
                {seriesOptions.map((option) => (
                  <label
                    className="label min-h-11 cursor-pointer justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-base-200 focus-within:bg-base-200"
                    key={`edit-${option}`}
                  >
                    <span className="label-text min-w-0 break-words">{option}</span>
                    <input
                      type="radio"
                      name="edit-series-toggle"
                      className="radio radio-primary shrink-0"
                      value={option}
                      checked={editFormData.series === option}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          series: e.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
            {editError && (
              <p role="alert" className="text-error text-sm sm:col-span-2">
                {editError}
              </p>
            )}
            <div className="modal-action sm:col-span-2 mt-0">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => editDialogRef.current?.close()}
                disabled={isUpdatingCar}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-gradient-primary"
                disabled={isUpdatingCar}
              >
                {isUpdatingCar ? (
                  <>
                    <span className="loading loading-spinner" aria-hidden="true"></span>
                    Saving…
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button aria-label="Close edit dialog">Close</button>
        </form>
      </dialog>
    </div>
  );
};

export default AdminDashboard;
