import { useEffect, useState } from "react";
import { getNearbyPoliceStations } from "../api/policeApi";
import "../styles/theme.css";

const PoliceStations = () => {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [coords, setCoords] = useState(null);

    const locateAndFetch = () => {
        setLoading(true);
        setError("");

        if (!navigator.geolocation) {
            setError("Your browser doesn't support location sharing.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setCoords({ latitude, longitude });
                try {
                    const data = await getNearbyPoliceStations(
                        latitude,
                        longitude
                    );
                    setStations(data);
                } catch (err) {
                    setError(
                        err.response?.data?.message ||
                            "Couldn't load nearby stations."
                    );
                } finally {
                    setLoading(false);
                }
            },
            () => {
                setError(
                    "Location access was denied. Enable it to find stations near you."
                );
                setLoading(false);
            }
        );
    };

    useEffect(() => {
        locateAndFetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="gg-page">
            <div className="gg-container">
                <div className="gg-eyebrow">Backup</div>
                <h1 className="gg-title">Police Stations Nearby</h1>
                <p className="gg-subtitle">
                    The five closest stations to your current location,
                    ranked by distance.
                </p>

                {error && (
                    <div className="gg-error-banner">
                        {error}{" "}
                        <button
                            onClick={locateAndFetch}
                            style={{
                                background: "none",
                                border: "none",
                                color: "#ff8a93",
                                textDecoration: "underline",
                                cursor: "pointer",
                                fontSize: 13,
                                padding: 0,
                            }}
                        >
                            Try again
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="gg-loading">
                        {coords ? "Finding nearby stations…" : "Getting your location…"}
                    </div>
                )}

                {!loading && !error && stations.length === 0 && (
                    <div className="gg-empty">
                        No police stations found nearby yet.
                    </div>
                )}

                {!loading &&
                    stations.map((station, i) => (
                        <div className="gg-card" key={station._id || i}>
                            <div className="gg-card-body gg-card-row">
                                <div>
                                    <div className="gg-card-title">
                                        {station.name || "Police Station"}
                                    </div>
                                    <p className="gg-card-text">
                                        {station.address ||
                                            `${station.latitude}, ${station.longitude}`}
                                    </p>
                                </div>
                                <span className="gg-badge gg-badge-neutral">
                                    {station.distance?.toFixed
                                        ? `${station.distance.toFixed(3)}°`
                                        : "—"}
                                </span>
                            </div>
                            {station.phone && (
                                <div
                                    style={{
                                        borderTop: "1px solid var(--line)",
                                        padding: "10px 20px",
                                    }}
                                >
                                    <a
                                        href={`tel:${station.phone}`}
                                        style={{
                                            color: "#ff8a93",
                                            fontSize: 13,
                                            fontFamily: "var(--font-mono)",
                                            textDecoration: "none",
                                        }}
                                    >
                                        Call {station.phone}
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default PoliceStations;
