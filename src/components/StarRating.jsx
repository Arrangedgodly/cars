const StarRating = ({ rating, onRatingChange, carId, readOnly = false }) => {
  const stars = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  const handleOnChange = (e) => {
    if (onRatingChange) {
      onRatingChange(parseFloat(e.target.value));
    }
  };

  return (
    <div className="rating rating-md rating-half">
      <input type="radio" name={`rating-${carId}`} className="rating-hidden" defaultChecked={rating === 0} />
      
      {stars.map((value, index) => (
        <input
          key={value}
          type="radio"
          name={`rating-${carId}`}
          className={`mask mask-star-2 ${index % 2 === 0 ? 'mask-half-1' : 'mask-half-2'} bg-green-500`}
          aria-label={`${value} star`}
          value={value}
          checked={rating === value}
          onChange={handleOnChange}
          disabled={readOnly}
        />
      ))}
    </div>
  );
};

export default StarRating;