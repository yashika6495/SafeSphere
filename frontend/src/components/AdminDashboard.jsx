import { useEffect, useState } from "react";
import {
    getDashboardStats,
    getCrimeCategoryStats,
    getCrimeSeverityStats,
    getRecentCrimes,
} from "../api/adminApi";
import "../styles/theme.css";

const severityBadgeClass = (severity) => {
    if (severity === "High") return "gg-badge-alert";
    if (severity === "Medium") return "gg-badge-caution";
    return "gg-badge-safe";
};

const BarBreakdown = ({ title, data }) => {
    const max = Math.max(...data.map((d) => d.count), 1);
    return (
        <div className="gg-card">
            <div className="gg-card-body">
                <div className="gg-card-title" style={{ marginBottom: 14 }}>
                    {title}
                </div>
                {data.length === 0 && (
                    <div className="gg-loading">No data yet.</div>
                )}
                {data.map((d) => (
                    <div className="gg-bar-row" key={d._id || "unknown"}>
                        <span style={{ color: "var(--text-muted)" }}>
                            {d._id || "Unspecified"}
                        </span>
                        <div className="gg-bar-track">
                            <div
                                className="gg-bar-fill"
                                style={{
                                    width: `${(d.count / max) * 100}%`,
                                }}
                            />
                        </div>
                        <span
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 12,
                                textAlign: "right",
                            }}
                        >
                            {d.count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [categories, setCategories] = useState([]);
    const [severity, setSeverity] = useState([]);
    const [recentCrimes, setRecentCrimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadAll = async () => {
            try {
                const [s, c, sv, r] = await Promise.all([
                    getDashboardStats(),
                    getCrimeCategoryStats(),
                    getCrimeSeverityStats(),
                    getRecentCrimes(),
                ]);
                setStats(s);
                setCategories(c);
                setSeverity(sv);
                setRecentCrimes(r);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                        "Couldn't load dashboard data."
                );
            } finally {
                setLoading(false);
            }
        };
        loadAll();
    }, []);

    const statCards = stats
        ? [
              { label: "Total Users", value: stats.totalUser },
              { label: "Total Crimes", value: stats.totalCrimes },
              { label: "Total SOS", value: stats.totalSOS },
              { label: "Active Alerts", value: stats.activeAlerts },
              { label: "Resolved Alerts", value: stats.resolvedAlerts },
          ]
        : [];

    return (
        <div className="gg-page">
            <div className="gg-container" style={{ maxWidth: 960 }}>
                <div className="gg-eyebrow">Command Center</div>
                <h1 className="gg-title">Admin Dashboard</h1>
                <p className="gg-subtitle">
                    Platform-wide activity across users, crime reports, and
                    emergency signals.
                </p>

                {error && <div className="gg-error-banner">{error}</div>}
                {loading && <div className="gg-loading">Loading dashboard…</div>}

                {!loading && stats && (
                    <div className="gg-stat-grid">
                        {statCards.map((card) => (
                            <div className="gg-stat" key={card.label}>
                                <div className="gg-stat-value">
                                    {card.value}
                                </div>
                                <div className="gg-stat-label">
                                    {card.label}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 16,
                        }}
                    >
                        <BarBreakdown
                            title="Crimes by category"
                            data={categories}
                        />
                        <BarBreakdown
                            title="Crimes by severity"
                            data={severity}
                        />
                    </div>
                )}

                {!loading && (
                    <>
                        <div className="gg-section-title">
                            Recent crime reports
                        </div>
                        <div className="gg-card">
                            <div className="gg-card-body" style={{ padding: 0 }}>
                                <table className="gg-table">
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th>Severity</th>
                                            <th>Reported by</th>
                                            <th>Location</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentCrimes.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    style={{
                                                        color: "var(--text-muted)",
                                                    }}
                                                >
                                                    No crimes reported yet.
                                                </td>
                                            </tr>
                                        )}
                                        {recentCrimes.map((crime) => (
                                            <tr key={crime._id}>
                                                <td>{crime.category}</td>
                                                <td>
                                                    <span
                                                        className={`gg-badge ${severityBadgeClass(
                                                            crime.severity
                                                        )}`}
                                                    >
                                                        {crime.severity}
                                                    </span>
                                                </td>
                                                <td>
                                                    {crime.userId?.name ||
                                                        "Unknown"}
                                                </td>
                                                <td
                                                    style={{
                                                        color: "var(--text-muted)",
                                                    }}
                                                >
                                                    {crime.locationName ||
                                                        `${crime.latitude}, ${crime.longitude}`}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
