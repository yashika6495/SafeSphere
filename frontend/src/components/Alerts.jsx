import { useEffect, useState } from "react";
import { getAlerts, createAlert, resolveAlert } from "../api/alertApi";
import "../styles/theme.css";

const RISK_LEVELS = ["Safe", "Medium", "High"];

const riskBadgeClass = (riskLevel) => {
    if (riskLevel === "High") return "gg-badge-alert";
    if (riskLevel === "Medium") return "gg-badge-caution";
    return "gg-badge-safe";
};

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [locating, setLocating] = useState(false);

    const [form, setForm] = useState({
        latitude: "",
        longitude: "",
        locationName: "",
        riskLevel: "Medium",
        message: "",
    });

    const loadAlerts = async () => {
        try {
            const data = await getAlerts();
            setAlerts(data);
        } catch (err) {
            setError(err.response?.data?.message || "Couldn't load alerts.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAlerts();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const useMyLocation = () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setForm((f) => ({
                    ...f,
                    latitude: pos.coords.latitude.toFixed(6),
                    longitude: pos.coords.longitude.toFixed(6),
                }));
                setLocating(false);
            },
            () => setLocating(false)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.latitude || !form.longitude || !form.message.trim()) return;

        setSubmitting(true);
        setError("");
        try {
            await createAlert(form);
            setForm({
                latitude: "",
                longitude: "",
                locationName: "",
                riskLevel: "Medium",
                message: "",
            });
            await loadAlerts();
        } catch (err) {
            setError(err.response?.data?.message || "Couldn't report alert.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleResolve = async (id) => {
        const prev = alerts;
        setAlerts(
            alerts.map((a) => (a._id === id ? { ...a, status: "Resolved" } : a))
        );
        try {
            await resolveAlert(id);
        } catch (err) {
            setAlerts(prev);
            setError(err.response?.data?.message || "Couldn't resolve alert.");
        }
    };

    return (
        <div className="gg-page">
            <div className="gg-container">
                <div className="gg-eyebrow">Live Feed</div>
                <h1 className="gg-title">Alerts</h1>
                <p className="gg-subtitle">
                    Flag a risk in the moment, or track and resolve the ones
                    already reported.
                </p>

                {error && <div className="gg-error-banner">{error}</div>}

                <div className="gg-card">
                    <div className="gg-card-body">
                        <form onSubmit={handleSubmit} className="gg-form-grid">
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr auto",
                                    gap: 10,
                                }}
                            >
                                <input
                                    className="gg-input"
                                    name="latitude"
                                    placeholder="Latitude"
                                    value={form.latitude}
                                    onChange={handleChange}
                                />
                                <input
                                    className="gg-input"
                                    name="longitude"
                                    placeholder="Longitude"
                                    value={form.longitude}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className="gg-btn gg-btn-ghost"
                                    onClick={useMyLocation}
                                    disabled={locating}
                                >
                                    {locating ? "Locating…" : "Use my location"}
                                </button>
                            </div>

                            <input
                                className="gg-input"
                                name="locationName"
                                placeholder="Location name (e.g. MG Road bus stop)"
                                value={form.locationName}
                                onChange={handleChange}
                            />

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "140px 1fr",
                                    gap: 10,
                                }}
                            >
                                <select
                                    className="gg-input"
                                    name="riskLevel"
                                    value={form.riskLevel}
                                    onChange={handleChange}
                                >
                                    {RISK_LEVELS.map((level) => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    className="gg-input"
                                    name="message"
                                    placeholder="What's happening?"
                                    value={form.message}
                                    onChange={handleChange}
                                />
                            </div>

                            <button
                                type="submit"
                                className="gg-btn gg-btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? "Reporting…" : "Report alert"}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="gg-section-title">
                    Reported alerts ({alerts.length})
                </div>

                {loading && <div className="gg-loading">Loading alerts…</div>}

                {!loading && alerts.length === 0 && (
                    <div className="gg-empty">
                        No alerts reported yet. This feed fills up the moment
                        someone flags a risk nearby.
                    </div>
                )}

                {!loading &&
                    alerts.map((alert) => (
                        <div className="gg-card" key={alert._id}>
                            {alert.status !== "Resolved" && (
                                <div className="gg-hazard" />
                            )}
                            <div className="gg-card-body gg-card-row">
                                <div>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            alignItems: "center",
                                            marginBottom: 6,
                                        }}
                                    >
                                        <span
                                            className={`gg-badge ${riskBadgeClass(
                                                alert.riskLevel
                                            )}`}
                                        >
                                            {alert.riskLevel || "Unrated"}
                                        </span>
                                        <span className="gg-badge gg-badge-neutral">
                                            {alert.status || "Active"}
                                        </span>
                                    </div>
                                    <div className="gg-card-title">
                                        {alert.locationName ||
                                            `${alert.latitude}, ${alert.longitude}`}
                                    </div>
                                    <p className="gg-card-text">
                                        {alert.message}
                                    </p>
                                </div>
                                {alert.status !== "Resolved" && (
                                    <button
                                        className="gg-btn gg-btn-ghost"
                                        onClick={() => handleResolve(alert._id)}
                                    >
                                        Mark resolved
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default Alerts;
