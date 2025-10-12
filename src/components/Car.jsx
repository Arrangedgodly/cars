const Car = ({ car }) => {
  return (
    <div className="card">
      <figure>
        <img src={car.image} alt={car.name} className="w-full h-30" />
      </figure>
      <div className="card-body">
        <h2 className="text-lg text-center font-bold">{car.name}</h2>
        <p className="text-md text-center">Series: {car.series}</p>
      </div>
    </div>
  );
};

export default Car;
