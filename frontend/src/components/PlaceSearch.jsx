import { useEffect, useRef, useState } from "react";
import { searchPlaces } from "../services/mapService";

/**
 * Destination search.
 *
 * Debounced at 450ms because the geocoder allows roughly one request a
 * second — firing on every keystroke would spend the whole budget on
 * prefixes nobody meant to search for.
 */
export default function PlaceSearch({ near, onPick, onClear, activeName }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [highlight, setHighlight] = useState(0);

    const boxRef = useRef(null);
    const requestId = useRef(0);

    useEffect(() => {
        const term = query.trim();
        if (term.length < 3) {
            setResults([]);
            return;
        }

        const id = ++requestId.current;
        setBusy(true);

        const timer = setTimeout(async () => {
            try {
                const found = await searchPlaces(term, near?.[0], near?.[1]);
                // Ignore anything that resolved after a newer keystroke.
                if (id !== requestId.current) return;
                setResults(found);
                setHighlight(0);
                setOpen(true);
            } catch {
                if (id === requestId.current) setResults([]);
            } finally {
                if (id === requestId.current) setBusy(false);
            }
        }, 450);

        return () => clearTimeout(timer);
    }, [query, near]);

    useEffect(() => {
        const onDown = (e) => {
            if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, []);

    const choose = (place) => {
        onPick([place.latitude, place.longitude], place.name);
        setQuery("");
        setResults([]);
        setOpen(false);
    };

    const onKeyDown = (e) => {
        if (!open || !results.length) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => (h + 1) % results.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => (h - 1 + results.length) % results.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            choose(results[highlight]);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <div className="gg-search" ref={boxRef}>
            <div className="gg-search-bar">
                <span className="gg-search-icon" aria-hidden="true">⌕</span>
                <input
                    className="gg-search-input"
                    placeholder={activeName || "Search for a place…"}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length && setOpen(true)}
                    onKeyDown={onKeyDown}
                    aria-label="Search for a destination"
                />
                {busy && <span className="gg-map-spinner" />}
                {activeName && !query && (
                    <button
                        className="gg-search-clear"
                        onClick={onClear}
                        aria-label="Clear destination"
                    >
                        ✕
                    </button>
                )}
            </div>

            {open && results.length > 0 && (
                <ul className="gg-search-results">
                    {results.map((place, i) => (
                        <li key={`${place.latitude},${place.longitude},${i}`}>
                            <button
                                className={i === highlight ? "is-active" : ""}
                                onMouseEnter={() => setHighlight(i)}
                                onClick={() => choose(place)}
                            >
                                <span className="gg-search-name">{place.name}</span>
                                <span className="gg-search-context">{place.context}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {open && !busy && query.trim().length >= 3 && results.length === 0 && (
                <div className="gg-search-results gg-search-empty">
                    Nothing found for “{query.trim()}”.
                </div>
            )}
        </div>
    );
}
