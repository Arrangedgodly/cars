const mergeRanges = (ranges) => {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1] + 1) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
};

const HighlightText = ({ text, ranges }) => {
  if (!ranges || ranges.length === 0) return text;

  const merged = mergeRanges(ranges);
  const parts = [];
  let cursor = 0;

  merged.forEach(([start, end], i) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={i} className="bg-primary/20 text-primary rounded-sm">
        {text.slice(start, end + 1)}
      </mark>
    );
    cursor = end + 1;
  });

  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
};

export default HighlightText;
