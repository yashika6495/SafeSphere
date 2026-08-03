import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    Circle,
    useMap,
    useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getContacts } from "../api/contactApi";

import {
    getNearbyCrime,
    getNearbyPoliceStations,
    getSafetyScore,
    getRecentCrime,
    getSafeRoute,
    getCrimeHeatmap,
    getCrimeSeverity,
    getCrimeCategories,
} from "../services/mapService";

import LocationSidebar from "../components/LocationSidebar";
import ReportCrimeDialog from "../components/ReportCrimeDialog";
import RouteWarnings from "../components/RouteWarnings";
import PlaceSearch from "../components/PlaceSearch";
import HeatLayer from "../components/HeatLayer";
import SosDialog from "../components/SosDialog";
import "../styles/theme.css";

const FALLBACK = [19.076, 72.8777]; // Mumbai

// How close you have to get to a flagged street before it speaks up.
const WARN_TRIGGER_M = 220;

// Re-query map data only after drifting this far, so live tracking
// doesn't fire a full refetch on every GPS tick.
const REFETCH_DRIFT_M = 250;

const metresBetween = ([lat1, lng1], [lat2, lng2]) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// --- Markers -------------------------------------------------------
// divIcon rather than image pins, so markers inherit the theme.

const pin = (className, size) =>
    L.divIcon({
        className: "gg-marker",
        html: `<span class="${className}"></span>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
    });

const CRIME_PINS = {
    High: pin("gg-pin gg-pin-high", 18),
    Medium: pin("gg-pin gg-pin-medium", 16),
    Low: pin("gg-pin gg-pin-low", 14),
};

const POLICE_PIN = pin("gg-pin-police", 16);
const DEST_PIN = pin("gg-pin-dest", 18);

// Deliberately a different silhouette from everything else on the map:
// reports are flat circles and stations are squares, so "you" is a raised
// teardrop standing above the surface, anchored at its tip.
const ME_PIN = L.divIcon({
    className: "gg-marker",
    html: `<span class="gg-me"><i class="gg-me-halo"></i><i class="gg-me-pin"></i></span>`,
    iconSize: [30, 34],
    iconAnchor: [15, 30],
    popupAnchor: [0, -32],
});

// --- Map helpers ---------------------------------------------------

function MapClick({ onPick }) {
    useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) });
    return null;
}

function ChangeView({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, map.getZoom() || 14);
    }, [center, map]);
    return null;
}

export default function CrimeMap() {

    const { user } = useAuth();

    const [location, setLocation] = useState(FALLBACK);
    const [destination, setDestination] = useState(null);
    const [locating, setLocating] = useState(true);
    const [usingFallback, setUsingFallback] = useState(false);

    // Persisted: navigating to the profile and back remounts this
    // component, which used to reopen a panel the user had closed.
    const [sidebarOpen, setSidebarOpen] = useState(
        () => sessionStorage.getItem("gg-panel-open") !== "false"
    );
    const [travelMode, setTravelMode] = useState(
        () => sessionStorage.getItem("gg-travel-mode") || "walk"
    );
    const [selectedRoute, setSelectedRoute] = useState(0);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState("");

    const [crimeData, setCrimeData] = useState(null);
    const [policeData, setPoliceData] = useState([]);
    const [safetyScore, setSafetyScore] = useState(null);
    const [recentCrime, setRecentCrime] = useState([]);
    const [safeRoute, setSafeRoute] = useState(null);
    const [crimeSeverity, setCrimeSeverity] = useState([]);
    const [crimeCategories, setCrimeCategories] = useState([]);
    const [heatCells, setHeatCells] = useState([]);
    const [heatOn, setHeatOn] = useState(false);
    const [reporting, setReporting] = useState(false);
    const [justReported, setJustReported] = useState(false);
    const [destinationName, setDestinationName] = useState("");
    const [sosOpen, setSosOpen] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [livePosition, setLivePosition] = useState(null);
    const [toasts, setToasts] = useState([]);
    const announced = useRef(new Set());

    useEffect(() => {
        if (!navigator.geolocation) {
            setUsingFallback(true);
            setLocating(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation([pos.coords.latitude, pos.coords.longitude]);
                setLocating(false);
            },
            () => {
                // Denied, unavailable, or timed out — show the fallback city
                // rather than hanging on "Getting your location…" forever.
                setUsingFallback(true);
                setLocating(false);
            },
            { timeout: 8000, maximumAge: 60000 }
        );
    }, []);

    // Declared before any early return: a const function defined *after*
    // one is only reachable by luck, and throws on the next edit.
    const loadLocationData = useCallback(async () => {
        const [latitude, longitude] = location;

        setFetching(true);
        setError("");


        try {
            // These are independent — run them together rather than in
            // seven sequential round trips.
            const [crimes, police, score, recent, severity, categories, heat] =
                await Promise.all([
                    getNearbyCrime(latitude, longitude),
                    getNearbyPoliceStations(latitude, longitude),
                    getSafetyScore(latitude, longitude),
                    getRecentCrime(),
                    getCrimeSeverity(),
                    getCrimeCategories(),
                    getCrimeHeatmap(3),
                ]);


            setCrimeData(crimes);
            setPoliceData(Array.isArray(police) ? police : []);
            setSafetyScore(score);
            setRecentCrime(Array.isArray(recent) ? recent : []);
            setCrimeSeverity(Array.isArray(severity) ? severity : []);
            setCrimeCategories(Array.isArray(categories) ? categories : []);
            setHeatCells(Array.isArray(heat) ? heat : []);

            if (destination) {
                const route = await getSafeRoute(
                    latitude,
                    longitude,
                    destination[0],
                    destination[1],
                    travelMode
                );
                setSafeRoute(route);
                setSelectedRoute(0);
            } else {
                setSafeRoute(null);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                (err.response
                    ? `Couldn't load map data (${err.response.status}).`
                    : "Can't reach the server.")
            );
        } finally {
            setFetching(false);
        }
    }, [location, destination, travelMode]);

    useEffect(() => {
        getContacts().then(setContacts).catch(() => setContacts([]));
    }, []);

    useEffect(() => {
        sessionStorage.setItem("gg-panel-open", String(sidebarOpen));
    }, [sidebarOpen]);

    useEffect(() => {
        sessionStorage.setItem("gg-travel-mode", travelMode);
    }, [travelMode]);

    useEffect(() => {
        if (!locating) loadLocationData();
    }, [locating, loadLocationData]);

    // --- Live tracking, only while a route is active -----------------
    // Watching continuously would drain battery and leak location for no
    // reason; navigating is the one moment it's justified.
    useEffect(() => {
        if (!destination || !navigator.geolocation) return;

        const id = navigator.geolocation.watchPosition(
            (pos) => setLivePosition([pos.coords.latitude, pos.coords.longitude]),
            () => {},
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );

        return () => {
            navigator.geolocation.clearWatch(id);
            setLivePosition(null);
            announced.current = new Set();
            setToasts([]);
        };
    }, [destination]);

    // Declared above the effect that depends on it: dependency arrays
    // are evaluated during render, so a later const would be in the TDZ.
    const activeRoute = useMemo(() => {
        if (!safeRoute) return null;
        return safeRoute.options?.[selectedRoute] || safeRoute;
    }, [safeRoute, selectedRoute]);

    // Announce a flagged street once you're close enough to act on it.
    useEffect(() => {
        if (!livePosition || !activeRoute?.warnings?.length) return;

        for (const warning of activeRoute.warnings) {
            const key = warning.street;
            if (announced.current.has(key)) continue;

            const away = metresBetween(livePosition, [
                warning.latitude,
                warning.longitude,
            ]);
            if (away > WARN_TRIGGER_M) continue;

            announced.current.add(key);

            const toast = { ...warning, id: `${key}-${warning.count}` };
            setToasts((current) => [...current, toast]);
            setTimeout(
                () => setToasts((c) => c.filter((t) => t.id !== toast.id)),
                9000
            );
        }
    }, [livePosition, activeRoute]);

    // Only re-query once you've actually moved somewhere different.
    useEffect(() => {
        if (!livePosition) return;
        if (metresBetween(livePosition, location) < REFETCH_DRIFT_M) return;
        setLocation(livePosition);
    }, [livePosition, location]);

    const crimes = useMemo(
        () => (Array.isArray(crimeData?.crimes) ? crimeData.crimes : []),
        [crimeData]
    );

    const maxWeight = useMemo(
        () => Math.max(...heatCells.map((c) => c.weight), 1),
        [heatCells]
    );

    if (locating) {
        return (
            <div className="gg-map-boot">
                <div className="gg-eyebrow">SafeSphere</div>
                <h1 className="gg-title">Finding you…</h1>
                <p className="gg-subtitle">
                    Allow location access to see what's been reported nearby.
                </p>
            </div>
        );
    }

    const risk = safetyScore?.riskLevel;

    return (
        <div className="gg-map-screen">

            <MapContainer
                center={location}
                zoom={14}
                zoomControl={false}
                className="gg-map-canvas"
            >
                <ChangeView center={location} />
                <MapClick onPick={setDestination} />

                <TileLayer
                    attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <HeatLayer
                    cells={heatCells}
                    maxWeight={maxWeight}
                    visible={heatOn}
                />

                {!heatOn && crimes.map((crime) => (
                    <Marker
                        key={crime._id}
                        position={[crime.latitude, crime.longitude]}
                        icon={CRIME_PINS[crime.severity] || CRIME_PINS.Medium}
                    >
                        <Popup>
                            <div className="gg-popup">
                                <span
                                    className={`gg-badge gg-badge-${
                                        crime.severity === "High"
                                            ? "alert"
                                            : crime.severity === "Medium"
                                            ? "caution"
                                            : "safe"
                                    }`}
                                >
                                    {crime.severity}
                                </span>
                                <div className="gg-popup-title">{crime.category}</div>
                                <p className="gg-popup-text">{crime.description}</p>
                                <div className="gg-card-meta">
                                    {crime.locationName ||
                                        `${crime.latitude}, ${crime.longitude}`}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {policeData.map((station, i) => (
                    <Marker
                        key={station._id || i}
                        position={[station.latitude, station.longitude]}
                        icon={POLICE_PIN}
                    >
                        <Popup>
                            <div className="gg-popup">
                                <span className="gg-badge gg-badge-neutral">Police</span>
                                <div className="gg-popup-title">{station.name}</div>
                                <p className="gg-popup-text">{station.address}</p>
                                {station.phone && (
                                    <a className="gg-popup-link" href={`tel:${station.phone}`}>
                                        {station.phone}
                                    </a>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <Marker
                    position={location}
                    icon={ME_PIN}
                    draggable
                    eventHandlers={{
                        dragend: (e) => {
                            const { lat, lng } = e.target.getLatLng();
                            setLocation([lat, lng]);
                            setUsingFallback(false);
                        },
                        click: () => setSidebarOpen(true),
                    }}
                />

                {destination && (
                    <Marker position={destination} icon={DEST_PIN}>
                        <Popup>
                            <div className="gg-popup">
                                <div className="gg-popup-title">Destination</div>
                                <p className="gg-popup-text">
                                    Click anywhere else to move it.
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {destination && (
                    <>
                        {/* Unselected alternatives, behind and dimmed */}
                        {safeRoute?.options
                            ?.filter((_, i) => i !== selectedRoute)
                            .map((o) => (
                                <Polyline
                                    key={`alt-${o.id}`}
                                    positions={o.geometry}
                                    pathOptions={{
                                        color: "#8993a6",
                                        weight: 5,
                                        opacity: 0.4,
                                        dashArray: "1 9",
                                        lineCap: "round",
                                    }}
                                    eventHandlers={{
                                        click: () =>
                                            setSelectedRoute(
                                                safeRoute.options.indexOf(o)
                                            ),
                                    }}
                                />
                            ))}

                        {/* Casing under the active route, as nav apps draw it */}
                        <Polyline
                            positions={activeRoute?.geometry || [location, destination]}
                            pathOptions={{
                                color: "#0b0d12",
                                weight: 11,
                                opacity: 0.85,
                                lineCap: "round",
                                lineJoin: "round",
                            }}
                        />
                        <Polyline
                            positions={activeRoute?.geometry || [location, destination]}
                            pathOptions={{
                                color:
                                    activeRoute?.riskLevel === "High"
                                        ? "#e63946"
                                        : activeRoute?.riskLevel === "Medium"
                                        ? "#f4a340"
                                        : "#3ddc97",
                                weight: 6,
                                opacity: 0.95,
                                lineCap: "round",
                                lineJoin: "round",
                                // Dashed only when the router was unreachable
                                // and this is the straight-line fallback.
                                dashArray: safeRoute?.routed === false ? "2 12" : null,
                            }}
                        />
                    </>
                )}

                {/* Flagged stretches along the route */}
                {activeRoute?.warnings?.map((w) => (
                    <Circle
                        key={w.street}
                        center={[w.latitude, w.longitude]}
                        radius={130}
                        pathOptions={{
                            color: w.level === "High" ? "#e63946" : "#f4a340",
                            weight: 1.5,
                            opacity: 0.7,
                            fillColor: w.level === "High" ? "#e63946" : "#f4a340",
                            fillOpacity: 0.12,
                        }}
                    />
                ))}
            </MapContainer>

            {/* --- Chrome, above the map --- */}

            {usingFallback && (
                <div className="gg-map-notice">
                    Location unavailable — showing Mumbai. Drag your pin to move.
                </div>
            )}

            {error && <div className="gg-map-notice gg-map-notice-error">{error}</div>}

            <div className="gg-map-layers">
                <button
                    className={!heatOn ? "is-active" : ""}
                    onClick={() => setHeatOn(false)}
                >
                    Reports
                </button>
                <button
                    className={heatOn ? "is-active" : ""}
                    onClick={() => setHeatOn(true)}
                >
                    Density
                </button>
            </div>

            <div className="gg-map-legend">
                <span><i className="gg-dot gg-dot-me" />You</span>
                {heatOn ? (
                    <>
                        <span><i className="gg-dot gg-dot-low" />Lighter</span>
                        <span><i className="gg-dot gg-dot-medium" />Busier</span>
                        <span><i className="gg-dot gg-dot-high" />Heaviest</span>
                    </>
                ) : (
                    <>
                        <span><i className="gg-dot gg-dot-high" />High</span>
                        <span><i className="gg-dot gg-dot-medium" />Medium</span>
                        <span><i className="gg-dot gg-dot-low" />Low</span>
                    </>
                )}
                <span><i className="gg-dot gg-dot-police" />Police</span>
            </div>

            {!sidebarOpen && (
                <button
                    className="gg-map-toggle"
                    onClick={() => setSidebarOpen(true)}
                >
                    Details
                </button>
            )}

            <PlaceSearch
                near={location}
                activeName={destinationName}
                onPick={(coords, name) => {
                    setDestination(coords);
                    setDestinationName(name);
                }}
                onClear={() => {
                    setDestination(null);
                    setDestinationName("");
                }}
            />

            <button
                className="gg-map-sos"
                onClick={() => setSosOpen(true)}
                title="Emergency SOS (simulated)"
            >
                SOS
            </button>

            <Link
                to="/profile"
                className="gg-map-account"
                title={user?.name ? `Signed in as ${user.name}` : "Your account"}
                aria-label="Your account"
            >
                {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
            </Link>

            <button
                className="gg-map-report"
                onClick={() => setReporting(true)}
            >
                <span className="gg-map-report-mark">+</span>
                Report something
            </button>

            {justReported && (
                <div className="gg-map-notice gg-map-notice-ok">
                    Report filed — it's on the map now.
                </div>
            )}

            <RouteWarnings
                toasts={toasts}
                onDismiss={(id) =>
                    setToasts((c) => c.filter((t) => t.id !== id))
                }
            />

            <SosDialog
                open={sosOpen}
                onClose={() => setSosOpen(false)}
                location={livePosition || location}
                contacts={contacts}
                station={policeData[0]}
            />

            <ReportCrimeDialog
                open={reporting}
                onClose={() => setReporting(false)}
                location={location}
                onReported={() => {
                    setJustReported(true);
                    setTimeout(() => setJustReported(false), 4000);
                    loadLocationData();
                }}
            />

            <LocationSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                location={location}
                fetching={fetching}
                safetyScore={safetyScore}
                crimeData={crimeData}
                police={policeData}
                recentCrime={recentCrime}
                safeRoute={safeRoute}
                activeRoute={activeRoute}
                selectedRoute={selectedRoute}
                onSelectRoute={setSelectedRoute}
                travelMode={travelMode}
                onTravelMode={setTravelMode}
                crimeSeverity={crimeSeverity}
                crimeCategories={crimeCategories}
                onClearDestination={() => { setDestination(null); setDestinationName(""); }}
            />
        </div>
    );
}
