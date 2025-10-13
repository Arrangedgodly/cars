import ReadOnlyRating from "./ReadOnlyRating";
import EditRating from "./EditRating";

const Car = ({ car, currentUser }) => {
  return (
    <div className="card bg-slate-500">
      <figure>
        <img src={car.image} alt={car.name} className="w-full h-30 bg-white" />
      </figure>
      <div className="card-body p-2">
        <h2 className="text-md text-center font-bold truncate m-1">{car.name}</h2>
        <p className="text-xs text-center truncate">Series: {car.series}</p>
      </div>
      <div className="card-actions justify-center p-2">
        {currentUser ? <EditRating /> : <ReadOnlyRating />}
        <button className="btn btn-sm m-1">Add to Collection</button>
      </div>
    </div>
  );
};

export default Car;
