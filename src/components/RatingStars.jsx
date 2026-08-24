const RatingStars = ({ value = 0 }) => {
  return (
    <span
      className="inline-flex font-fancy text-sm leading-none"
      aria-label={`${value} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, value - i)) * 100;
        return (
          <span key={i} className="relative inline-block">
            <span className="text-base-300">★</span>
            <span
              className="absolute inset-0 overflow-hidden text-primary"
              style={{ width: `${fill}%` }}
            >
              ★
            </span>
          </span>
        );
      })}
    </span>
  );
};

export default RatingStars;
