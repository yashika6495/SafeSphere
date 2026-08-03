const Crime = require("../models/Crime");
const { reverseGeocode } = require("../utils/geocode");
const { buildDirections } = require("../utils/directions");

/**
 * Routes scored against nearby reports, with alternatives ranked by how
 * much reported activity sits along each one.
 *
 * Reports are matched by perpendicular distance to the actual path, not
 * by a bounding box — a report only counts if it happened close to where
 * you'll be.
 *
 * TWO LIMITATIONS OF THE PUBLIC DEMO ROUTER, both worth knowing:
 *
 *  1. router.project-osrm.org serves only the driving network. The /foot/
 *     and /bike/ endpoints answer, but return identical geometry and car
 *     timings. So mode changes the time estimate and the corridor width,
 *     NOT the path. Point OSRM_URL at an instance with foot/bike profiles
 *     built and each mode starts returning genuinely different geometry —
 *     footpaths, ignored one-ways, and so on.
 *
 *  2. There is no public transit routing here at all. Buses and metro
 *     need a GTFS-fed engine (OpenTripPlanner) or a commercial API; OSRM
 *     cannot do it at any configuration.
 */
const OSRM_BASE = process.env.OSRM_URL || "https://router.project-osrm.org";
const OSRM_TIMEOUT_MS = 9000;

const MODES = {
    walk:  { profile: "foot",    kmh: 4.8,  corridorM: 150, label: "Walking" },
    cycle: { profile: "bike",    kmh: 15,   corridorM: 120, label: "Cycling" },
    drive: { profile: "driving", kmh: null, corridorM: 80,  label: "Driving" },
};

const WARN_MIN_REPORTS = 2;
const SEVERITY_WEIGHT = { High: 3, Medium: 1.8, Low: 1 };

// --- Geometry ------------------------------------------------------

const projector = (lat0) => {
    const kx = 111.32 * Math.cos((lat0 * Math.PI) / 180);
    const ky = 110.574;
    return (lat, lng) => ({ x: lng * kx, y: lat * ky });
};

const pointToSegmentKm = (p, a, b) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y);

    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));

    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};

const fetchRoutes = async (mode, srcLat, srcLng, destLat, destLng) => {
    const coords = `${srcLng},${srcLat};${destLng},${destLat}`;
    const url =
        `${OSRM_BASE}/route/v1/${mode.profile}/${coords}` +
        `?overview=full&geometries=geojson&steps=true&alternatives=2`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return [];

        const data = await response.json();
        if (data.code !== "Ok" || !data.routes?.length) return [];

        return data.routes;
    } catch {
        return [];
    } finally {
        clearTimeout(timer);
    }
};

/** Scores one OSRM route against the reports that sit along it. */
const scoreRoute = (route, crimes, mode, project) => {
    const geometry = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

    const streetAt = [];
    for (const step of route.legs[0].steps) {
        const count = step.geometry?.coordinates?.length || 0;
        for (let i = 0; i < count; i++) streetAt.push(step.name || "");
    }

    const path = geometry.map(([lat, lng]) => project(lat, lng));
    const corridorKm = mode.corridorM / 1000;

    const onRoute = [];
    let riskScore = 0;

    for (const crime of crimes) {
        const p = project(crime.latitude, crime.longitude);

        let best = Infinity;
        let bestIndex = 0;

        for (let i = 0; i < path.length - 1; i++) {
            const d = pointToSegmentKm(p, path[i], path[i + 1]);
            if (d < best) {
                best = d;
                bestIndex = i;
                if (best === 0) break;
            }
        }

        if (best > corridorKm) continue;

        riskScore += SEVERITY_WEIGHT[crime.severity] ?? 1;

        onRoute.push({
            _id: crime._id,
            category: crime.category,
            severity: crime.severity,
            description: crime.description,
            locationName: crime.locationName,
            latitude: crime.latitude,
            longitude: crime.longitude,
            createdAt: crime.createdAt,
            metresFromRoute: Math.round(best * 1000),
            street: streetAt[bestIndex] || crime.locationName || "this stretch",
        });
    }

    // --- Per-street warnings ---
    const byStreet = new Map();
    for (const crime of onRoute) {
        if (!byStreet.has(crime.street)) byStreet.set(crime.street, []);
        byStreet.get(crime.street).push(crime);
    }

    const warnings = [];
    for (const [street, list] of byStreet) {
        if (list.length < WARN_MIN_REPORTS) continue;

        const counts = new Map();
        list.forEach((c) => counts.set(c.category, (counts.get(c.category) || 0) + 1));

        const [topCategory, topCount] =
            [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

        const high = list.filter((c) => c.severity === "High").length;

        // Only name a category when it genuinely dominates, otherwise a
        // mixed street would get mislabelled.
        const dominant = topCount / list.length >= 0.4;

        warnings.push({
            street,
            count: list.length,
            highCount: high,
            category: dominant ? topCategory : null,
            level: high >= 3 || list.length >= 6 ? "High" : "Medium",
            latitude: list[0].latitude,
            longitude: list[0].longitude,
            message: dominant
                ? `${street} has an unusually high number of ${topCategory.toLowerCase()} reports.`
                : `${street} has ${list.length} recent reports along your route.`,
        });
    }

    warnings.sort((a, b) => b.count - a.count);

    const distanceKm = route.distance / 1000;

    const durationMin = mode.kmh
        ? Math.max(1, Math.round((distanceKm / mode.kmh) * 60))
        : Math.max(1, Math.round(route.duration / 60));

    // Normalised by length: 8 reports over 6km is a different trip from
    // 8 packed into 400 metres.
    const perKm = riskScore / Math.max(distanceKm, 0.3);

    let riskLevel = "Low";
    if (perKm > 9) riskLevel = "High";
    else if (perKm > 4) riskLevel = "Medium";

    return {
        geometry,
        distanceKm: +distanceKm.toFixed(2),
        durationMin,
        riskScore: Math.round(riskScore * 10) / 10,
        riskPerKm: Math.round(perKm * 10) / 10,
        riskLevel,
        crimeCount: onRoute.length,
        warnings,
        directions: buildDirections(route.legs[0].steps),
        crimes: onRoute.sort((a, b) => a.metresFromRoute - b.metresFromRoute),
    };
};

const getSafePath = async (req, res) => {
    try {
        const {
            sourceLatitude,
            sourceLongitude,
            destinationLatitude,
            destinationLongitude,
            mode: requestedMode,
        } = req.body;

        if (
            sourceLatitude == null ||
            sourceLongitude == null ||
            destinationLatitude == null ||
            destinationLongitude == null
        ) {
            return res.status(400).json({
                message: "All coordinates are required",
            });
        }

        const srcLat = Number(sourceLatitude);
        const srcLng = Number(sourceLongitude);
        const destLat = Number(destinationLatitude);
        const destLng = Number(destinationLongitude);

        if ([srcLat, srcLng, destLat, destLng].some(Number.isNaN)) {
            return res.status(400).json({
                message: "Coordinates must be numbers",
            });
        }

        const modeKey = MODES[requestedMode] ? requestedMode : "walk";
        const mode = MODES[modeKey];

        const routes = await fetchRoutes(mode, srcLat, srcLng, destLat, destLng);

        // Widest corridor of any mode, so one crime query serves them all.
        const pad = 0.2 / 110;
        const allLats = routes.length
            ? routes.flatMap((r) => r.geometry.coordinates.map((c) => c[1]))
            : [srcLat, destLat];
        const allLngs = routes.length
            ? routes.flatMap((r) => r.geometry.coordinates.map((c) => c[0]))
            : [srcLng, destLng];

        const candidates = await Crime.find({
            latitude: { $gte: Math.min(...allLats) - pad, $lte: Math.max(...allLats) + pad },
            longitude: { $gte: Math.min(...allLngs) - pad, $lte: Math.max(...allLngs) + pad },
        });

        const project = projector(srcLat);

        const [fromName, toName] = await Promise.all([
            reverseGeocode(srcLat, srcLng),
            reverseGeocode(destLat, destLng),
        ]);

        if (!routes.length) {
            // Routing engine unreachable — still answer with something
            // usable, flagged so the UI can say so.
            return res.status(200).json({
                routed: false,
                mode: modeKey,
                modeLabel: mode.label,
                from: fromName,
                to: toName,
                source: { latitude: srcLat, longitude: srcLng },
                destination: { latitude: destLat, longitude: destLng },
                options: [],
                geometry: [[srcLat, srcLng], [destLat, destLng]],
                distanceKm: null,
                durationMin: null,
                corridorMetres: mode.corridorM,
                riskLevel: "Low",
                riskScore: 0,
                crimeCount: 0,
                warnings: [],
                directions: [],
                crimes: [],
            });
        }

        const scored = routes.map((r) => scoreRoute(r, candidates, mode, project));

        // Rank by reported activity per km, then by length — the point of
        // showing alternatives is to surface the calmer one, not the
        // shortest one.
        const ranked = scored
            .map((s, i) => ({ ...s, originalIndex: i }))
            .sort((a, b) => a.riskPerKm - b.riskPerKm || a.distanceKm - b.distanceKm);

        const best = ranked[0];
        const fastest = scored.reduce((a, b) => (a.distanceKm <= b.distanceKm ? a : b));

        res.status(200).json({
            routed: true,
            mode: modeKey,
            modeLabel: mode.label,
            // The demo router has one network; say so rather than implying
            // the path was computed for this mode.
            approximateGeometry: true,

            from: fromName,
            to: toName,
            source: { latitude: srcLat, longitude: srcLng },
            destination: { latitude: destLat, longitude: destLng },

            corridorMetres: mode.corridorM,

            options: ranked.map((r, i) => ({
                id: r.originalIndex,
                label:
                    ranked.length === 1
                        ? "Route"
                        : i === 0
                        ? "Calmest"
                        : r.distanceKm === fastest.distanceKm
                        ? "Shortest"
                        : `Option ${i + 1}`,
                recommended: i === 0,
                distanceKm: r.distanceKm,
                durationMin: r.durationMin,
                riskLevel: r.riskLevel,
                riskPerKm: r.riskPerKm,
                crimeCount: r.crimeCount,
                geometry: r.geometry,
                warnings: r.warnings,
                directions: r.directions,
                crimes: r.crimes,
            })),

            // Top-level fields mirror the recommended option.
            geometry: best.geometry,
            distanceKm: best.distanceKm,
            durationMin: best.durationMin,
            riskLevel: best.riskLevel,
            riskScore: best.riskScore,
            crimeCount: best.crimeCount,
            warnings: best.warnings,
            directions: best.directions,
            crimes: best.crimes,
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = {
    getSafePath,
};
