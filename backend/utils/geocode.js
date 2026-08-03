/**
 * Reverse geocoding via Nominatim (OpenStreetMap).
 *
 * Nominatim's usage policy caps this at one request per second and
 * requires an identifying User-Agent, so calls are serialised through a
 * single promise chain and cached by rounded coordinate. Rounding to 4
 * decimals (~11m) means panning a few metres reuses the cached answer.
 *
 * Set NOMINATIM_URL to a self-hosted instance to lift the rate limit.
 */

const NOMINATIM =
    process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org";
const USER_AGENT = process.env.NOMINATIM_UA || "SafeSphere/dev (local development)";
const MIN_INTERVAL_MS = 1100;
const TIMEOUT_MS = 6000;
const MAX_CACHE = 500;

const cache = new Map();
let queue = Promise.resolve();
let lastCall = 0;

const remember = (key, value) => {
    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
    cache.set(key, value);
    return value;
};

/** Picks the most useful short label out of a Nominatim address. */
const labelFrom = (data) => {
    if (!data) return null;
    const a = data.address || {};

    const street =
        a.road || a.pedestrian || a.footway || a.neighbourhood || a.suburb;
    const area = a.suburb || a.neighbourhood || a.city_district || a.town;
    const city = a.city || a.state_district || a.county;

    const parts = [street, area !== street ? area : null, city].filter(Boolean);

    if (parts.length) return parts.slice(0, 2).join(", ");
    return data.display_name?.split(",").slice(0, 2).join(",").trim() || null;
};

const reverseGeocode = async (lat, lng) => {
    const key = `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`;
    if (cache.has(key)) return cache.get(key);

    // Serialise: concurrent callers queue behind each other rather than
    // firing simultaneously and tripping the rate limit.
    queue = queue.then(async () => {
        if (cache.has(key)) return cache.get(key);

        const wait = Math.max(0, lastCall + MIN_INTERVAL_MS - Date.now());
        if (wait) await new Promise((r) => setTimeout(r, wait));
        lastCall = Date.now();

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const url =
                `${NOMINATIM}/reverse?lat=${lat}&lon=${lng}` +
                `&format=json&zoom=17&addressdetails=1`;

            const response = await fetch(url, {
                signal: controller.signal,
                headers: { "User-Agent": USER_AGENT },
            });

            if (!response.ok) return remember(key, null);
            return remember(key, labelFrom(await response.json()));
        } catch {
            // Never let a naming lookup break the thing it was labelling.
            return remember(key, null);
        } finally {
            clearTimeout(timer);
        }
    });

    return queue;
};

/**
 * Free-text place search. Biased toward the caller's map position when
 * one is supplied, so "MG Road" resolves to the one they're near rather
 * than the first match on the planet.
 */
const searchPlaces = async (query, { lat, lng } = {}) => {
    const q = String(query || "").trim();
    if (q.length < 3) return [];

    const key = `s:${q.toLowerCase()}:${lat ? Number(lat).toFixed(1) : ""}`;
    if (cache.has(key)) return cache.get(key);

    queue = queue.then(async () => {
        if (cache.has(key)) return cache.get(key);

        const wait = Math.max(0, lastCall + MIN_INTERVAL_MS - Date.now());
        if (wait) await new Promise((r) => setTimeout(r, wait));
        lastCall = Date.now();

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const params = new URLSearchParams({
                q,
                format: "json",
                limit: "6",
                addressdetails: "1",
            });

            // ~40km box around the map centre, as a preference not a filter.
            if (lat != null && lng != null) {
                const d = 0.35;
                params.set(
                    "viewbox",
                    `${Number(lng) - d},${Number(lat) + d},${Number(lng) + d},${Number(lat) - d}`
                );
                params.set("bounded", "0");
            }

            const response = await fetch(`${NOMINATIM}/search?${params}`, {
                signal: controller.signal,
                headers: { "User-Agent": USER_AGENT },
            });

            if (!response.ok) return remember(key, []);

            const data = await response.json();

            return remember(
                key,
                data.map((r) => {
                    const parts = r.display_name.split(",").map((x) => x.trim());
                    return {
                        name: parts[0],
                        context: parts.slice(1, 4).join(", "),
                        latitude: Number(r.lat),
                        longitude: Number(r.lon),
                        type: r.type,
                    };
                })
            );
        } catch {
            return remember(key, []);
        } finally {
            clearTimeout(timer);
        }
    });

    return queue;
};

module.exports = { reverseGeocode, searchPlaces };
