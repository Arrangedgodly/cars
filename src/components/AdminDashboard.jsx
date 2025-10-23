import { useState } from "react";
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

  const [editingCar, setEditingCar] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    series: "",
    image: "",
  });

  // Unique values for filter dropdowns
  const uniqueTags = [...new Set(cars.flatMap((car) => car.tags || []))].sort();
  const uniqueSeries = [...new Set(cars.map((car) => car.series))].sort();

  const handleFilterChange = (filterType, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterType]: value || null,
    }));
  };

  const handleCarSelection = (carId) => {
    setSelectedCars((prevSelected) => {
      if (prevSelected.includes(carId)) {
        return prevSelected.filter((id) => id !== carId);
      } else {
        return [...prevSelected, carId];
      }
    });
  };

  const handleSaveTags = async () => {
    if (!tagInput.trim() || selectedCars.length === 0) {
      setMessage({
        type: "error",
        text: "Please enter a tag and select at least one car.",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return;
    }

    setIsSavingTags(true);
    setMessage({ type: "", text: "" });
    const tagToAdd = tagInput.trim();

    const batch = writeBatch(db);
    selectedCars.forEach((carId) => {
      const carDocRef = doc(db, "cars", carId);
      batch.update(carDocRef, { tags: arrayUnion(tagToAdd) });
    });

    try {
      await batch.commit();
      onCarsTagged(selectedCars, tagToAdd);
      setMessage({
        type: "success",
        text: `Successfully added tag "${tagToAdd}" to ${selectedCars.length} cars.`,
      });
      setSelectedCars([]);
      setTagInput("");
    } catch (error) {
      setMessage({
        type: "error",
        text: `Error saving tags: ${error.message}`,
      });
    } finally {
      setIsSavingTags(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setMessage({
        type: "error",
        text: "You are not authorized to perform this action.",
      });
      return;
    }
    if (!name || !image || !series) {
      setMessage({ type: "error", text: "Please fill out all fields." });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const carsCollectionRef = collection(db, "cars");
      const newCarData = { name, image, series };
      const docRef = await addDoc(carsCollectionRef, newCarData);
      onCarAdded({ id: docRef.id, ...newCarData });
      setMessage({ type: "success", text: `Successfully added "${name}"!` });
      setName("");
      setImage("");
      setSeries(seriesOptions[0]);
    } catch (error) {
      setMessage({ type: "error", text: `Error adding car: ${error.message}` });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    }
  };

  const handleEditClick = (car) => {
    setEditingCar(car);
    setEditFormData(car);
    document.getElementById("edit_car_modal").showModal();
  };

  const handleUpdateCar = async (e) => {
    e.preventDefault();
    const carDocRef = doc(db, "cars", editingCar.id);

    try {
      await updateDoc(carDocRef, editFormData);
      onCarUpdated({ id: editingCar.id, ...editFormData });
      document.getElementById("edit_car_modal").close();
      setEditingCar(null);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const sortedAndFilteredCars = [...cars]
    .filter((car) => {
      const term = searchTerm.toLowerCase();
      const carTags = car.tags || [];

      const matchesSearch =
        searchTerm === ""
          ? true
          : car.name.toLowerCase().includes(term) ||
            car.series.toLowerCase().includes(term) ||
            carTags.some((tag) => tag.toLowerCase().includes(term));

      const matchesTag = filters.tag ? carTags.includes(filters.tag) : true;
      const matchesSeries = filters.series
        ? car.series === filters.series
        : true;

      return matchesSearch && matchesTag && matchesSeries;
    })
    .sort((a, b) => {
      const [field, direction] = sortBy.split("-");
      const valA = field === "series" ? a.series : a.name;
      const valB = field === "series" ? b.series : b.name;

      if (direction === "asc") {
        return valA.localeCompare(valB);
      } else {
        return valB.localeCompare(valA);
      }
    });

  return (
    <div className="bg-base-300 rounded-lg shadow-xl p-8 w-full">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>
      <div className="border-t border-base-100 pt-6">
        <h2 className="text-xl font-semibold mb-4">Add a New Car</h2>
        <form onSubmit={handleAddCar} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Car Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered w-full"
          />
          <input
            type="text"
            placeholder="Image URL"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="input input-bordered w-full"
          />
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Series</span>
            </label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {seriesOptions.map((option) => (
                <div className="form-control" key={option}>
                  <label className="label cursor-pointer gap-2">
                    <span className="label-text">{option}</span>
                    <input
                      type="radio"
                      name="series-toggle"
                      className="radio radio-primary"
                      value={option}
                      checked={series === option}
                      onChange={(e) => setSeries(e.target.value)}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full mt-2"
          >
            {isSubmitting ? (
              <span className="loading loading-spinner"></span>
            ) : (
              "Add Car to Database"
            )}
          </button>
        </form>
        {message.text && (
          <div
            className={`mt-4 text-center p-2 rounded-md ${
              message.type === "success"
                ? "bg-success text-success-content"
                : "bg-error text-error-content"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
      <div className="border-t border-base-100 pt-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">
          Current Car Database ({sortedAndFilteredCars.length})
        </h2>
        <div className="bg-base-100 p-4 rounded-lg mb-6 shadow">
          <h3 className="text-lg font-semibold mb-2">Tagging Tool</h3>
          <p className="text-sm opacity-70 mb-4">
            Enter a tag, click on cars below to select them, then save.
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div className="form-control flex-grow">
              <label className="label">
                <span className="label-text">New Tag</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Racecar, Exclusive"
                className="input input-bordered w-full"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleSaveTags}
              disabled={isSavingTags || !tagInput || selectedCars.length === 0}
            >
              {isSavingTags ? (
                <span className="loading loading-spinner"></span>
              ) : (
                `Save Tag to ${selectedCars.length} Cars`
              )}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setSelectedCars([])}
              disabled={selectedCars.length === 0}
            >
              Clear Selection
            </button>
          </div>
        </div>
        {/* --- CONTROLS BAR --- */}
        <div className="flex flex-wrap items-end justify-center gap-4 mb-4 bg-base-100 p-4 rounded-lg">
          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">Search</span>
            </label>
            <input
              type="text"
              placeholder="Search..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
              <option value="series-asc">Series (A-Z)</option>
              <option value="series-desc">Series (Z-A)</option>
            </select>
          </div>
          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">Filter by Series</span>
            </label>
            <select
              className="select select-bordered"
              value={filters.series || ""}
              onChange={(e) => handleFilterChange("series", e.target.value)}
            >
              <option value="">All Series</option>
              {uniqueSeries.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">Filter by Tag</span>
            </label>
            <select
              className="select select-bordered"
              value={filters.tag || ""}
              onChange={(e) => handleFilterChange("tag", e.target.value)}
            >
              <option value="">All Tags</option>
              {uniqueTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
          {sortedAndFilteredCars.map((car) => {
            const isSelected = selectedCars.includes(car.id);
            return (
              <div key={car.id} className="flex flex-col">
                <div
                  onClick={() => handleCarSelection(car.id)}
                  className={`bg-base-100 p-2 rounded-lg flex items-center gap-3 tooltip tooltip-primary cursor-pointer transition-all w-full ${
                    isSelected ? "ring-2 ring-accent" : "ring-0"
                  }`}
                  data-tip={car.name}
                >
                  <div className="avatar">
                    <div className="w-12 rounded">
                      <img src={car.image} alt={car.name} />
                    </div>
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <p className="text-sm font-bold truncate">{car.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {car.series}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(car);
                    }}
                    className="btn btn-square btn-sm flex-shrink-0"
                  >
                    ✏️
                  </button>
                </div>

                <div className="flex flex-wrap gap-1 mt-1.5 w-full min-h-[22px]">
                  {car.tags?.map((tag) => (
                    <div
                      key={tag}
                      className="badge badge-info badge-xs truncate"
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <dialog id="edit_car_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Edit Car: {editingCar?.name}</h3>
          <form onSubmit={handleUpdateCar} className="py-4">
            <div className="form-control w-full">
              <label className="label" htmlFor="edit-name">
                <span className="label-text">Car Name</span>
              </label>
              <input
                id="edit-name"
                type="text"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                className="input input-bordered w-full"
              />
            </div>
            <div className="form-control w-full mt-4">
              <label className="label" htmlFor="edit-image">
                <span className="label-text">Image URL</span>
              </label>
              <input
                id="edit-image"
                type="text"
                value={editFormData.image}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, image: e.target.value })
                }
                className="input input-bordered w-full"
              />
            </div>
            <div className="form-control w-full mt-4">
              <label className="label">
                <span className="label-text font-semibold">Series</span>
              </label>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {seriesOptions.map((option) => (
                  <div className="form-control" key={`edit-${option}`}>
                    <label className="label cursor-pointer gap-2">
                      <span className="label-text">{option}</span>
                      <input
                        type="radio"
                        name="edit-series-toggle"
                        className="radio radio-primary"
                        value={option}
                        checked={editFormData.series === option}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            series: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-action">
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default AdminDashboard;
