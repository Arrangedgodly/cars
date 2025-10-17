import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";

const AdminDashboard = ({ db, isAdmin, cars, onCarAdded, onCarUpdated }) => {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [series, setSeries] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  const [editingCar, setEditingCar] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    series: "",
    image: "",
  });

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
      setSeries("");
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
    .sort((a, b) => {
      if (sortDirection === "asc") {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    })
    .filter((car) => car.name.toLowerCase().includes(searchTerm.toLowerCase()));

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
          <input
            type="text"
            placeholder="Car Series"
            value={series}
            onChange={(e) => setSeries(e.target.value)}
            className="input input-bordered w-full"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full"
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

        <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
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

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
          {sortedAndFilteredCars.map((car) => (
            <div
              key={car.id}
              className="bg-base-100 p-2 rounded-lg flex items-center gap-3"
            >
              <div className="avatar">
                <div className="w-12 rounded">
                  <img src={car.image} alt={car.name} />
                </div>
              </div>
              <div className="flex-grow overflow-hidden">
                <p className="text-sm font-bold truncate">{car.name}</p>
                <p className="text-xs text-gray-400 truncate">{car.series}</p>
              </div>
              <button
                onClick={() => handleEditClick(car)}
                className="btn btn-square btn-sm"
              >
                ✏️
              </button>
            </div>
          ))}
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
              <label className="label" htmlFor="edit-series">
                <span className="label-text">Car Series</span>
              </label>
              <input
                id="edit-series"
                type="text"
                value={editFormData.series}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, series: e.target.value })
                }
                className="input input-bordered w-full"
              />
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
