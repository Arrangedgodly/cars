const Car = ({ car }) => {
  return (
    <div className="card bg-slate-500">
      <figure>
        <img src={car.image} alt={car.name} className="w-full h-30 bg-white" />
      </figure>
      <div className="card-body">
        <h2 className="text-md text-center font-bold truncate">{car.name}</h2>
        <p className="text-xs text-center truncate">Series: {car.series}</p>
      </div>
    </div>
  );
};

export default Car;
