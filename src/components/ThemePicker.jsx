import { useEffect, useRef, useState } from "react";

const CHARACTERS = [
  { id: "circuitred", label: "McQueen", swatch: "#e31c1c" },
  { id: "dinoco", label: "Dinoco", swatch: "#4fb3f5" },
  { id: "cruz", label: "Cruz", swatch: "#cddc1f" },
  { id: "mater", label: "Mater", swatch: "#b5622c" },
  { id: "doc", label: "Doc Hudson", swatch: "#2a4d8f" },
  { id: "ramone", label: "Ramone", swatch: "#7c3fd4" },
  { id: "chick", label: "Chick Hicks", swatch: "#2f9e54" },
];

const ThemePicker = ({ character, mode, onCharacterChange, onModeChange }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const current = CHARACTERS.find((c) => c.id === character) || CHARACTERS[0];

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          className="btn btn-outline btn-sm gap-2"
          aria-label="Choose color scheme"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span
            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: current.swatch }}
          />
          <span className="hidden sm:inline">{current.label}</span>
        </button>
        {open && (
          <ul className="absolute right-0 z-50 mt-2 w-40 p-1.5 menu bg-base-200 border border-base-300 rounded-box shadow-lg">
            {CHARACTERS.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    onCharacterChange(c.id);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2 text-sm ${c.id === character ? "active" : ""}`}
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.swatch }}
                  />
                  {c.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        className="btn btn-outline btn-sm btn-square"
        aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        onClick={() => onModeChange(mode === "dark" ? "light" : "dark")}
      >
        {mode === "dark" ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M20.354 15.354A9 9 0 0 1 8.646 3.646a9.003 9.003 0 1 0 11.708 11.708Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default ThemePicker;
