import "../styles/theme.css";

const toneFor = (level) =>
    level === "High" ? "alert" : level === "Medium" ? "caution" : "safe";

const dotFor = (severity) =>
    severity === "High" ? "high" : severity === "Medium" ? "medium" : "low";

const MODES = [
    { value: "walk", label: "Walk", icon: "🚶" },
    { value: "cycle", label: "Cycle", icon: "🚲" },
    { value: "drive", label: "Drive", icon: "🚗" },
];

const SEVERITY_RANK = { High: 3, Medium: 2, Low: 1 };

// Worst first, then most recent. A list of 55 is noise — the handful that
// would actually change someone's route is the point.
const mostSerious = (crimes, limit) =>
    [...crimes]
        .sort(
            (a, b) =>
                (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0) ||
                new Date(b.createdAt) - new Date(a.createdAt)
        )
        .slice(0, limit);

// What actually happens around here, as opposed to city-wide totals.
// "Mostly chain snatching" and "mostly cyber crime" call for different
// behaviour from the person reading it.
const profileOf = (crimes, limit) => {
    const counts = new Map();
    crimes.forEach((c) =>
        counts.set(c.category, (counts.get(c.category) || 0) + 1)
    );
    return [...counts.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
};

// Last 30 days against the 30 before it. A "Safe" area trending sharply
// worse is a different situation from a stable one.
const trendOf = (crimes) => {
    const now = Date.now();
    let recent = 0;
    let prior = 0;

    crimes.forEach((c) => {
        const ageDays = (now - new Date(c.createdAt).getTime()) / 86400000;
        if (ageDays <= 30) recent += 1;
        else if (ageDays <= 60) prior += 1;
    });

    if (prior === 0 && recent === 0) return null;
    if (prior === 0) return { recent, prior, pct: null, direction: "up" };

    const pct = Math.round(((recent - prior) / prior) * 100);
    return {
        recent,
        prior,
        pct: Math.abs(pct),
        direction: pct > 4 ? "up" : pct < -4 ? "down" : "flat",
    };
};

const Section = ({ title, count, children }) => (
    <div className="gg-panel-section">
        <div className="gg-panel-heading">
            <span>{title}</span>
            {count !== undefined && <span className="gg-panel-count">{count}</span>}
        </div>
        {children}
    </div>
);

export default function LocationSidebar({
    open,
    onClose,
    location,
    fetching,
    safetyScore,
    crimeData,
    tips,
    police,
    recentCrime,
    safeRoute,
    activeRoute,
    selectedRoute,
    onSelectRoute,
    travelMode,
    onTravelMode,
    crimeSeverity,
    crimeCategories,
    onClearDestination,
}) {
    if (!open) return null;

    const crimes = crimeData?.crimes || [];
    const topCrimes = mostSerious(crimes, 5);
    const profile = profileOf(crimes, 5);
    const trend = trendOf(crimes);
    const maxProfile = Math.max(...profile.map((p) => p.count), 1);
    const route = activeRoute || safeRoute || {};
    const stations = police || [];
    const recent = recentCrime || [];
    const severities = crimeSeverity || [];
    const risk = safetyScore?.riskLevel;
    const score = safetyScore?.score;
    const maxSeverity = Math.max(...severities.map((s) => s.count), 1);

    return (
        <aside className="gg-panel">
            {risk === "High" && <div className="gg-hazard" />}

            <header className="gg-panel-head">
                <div>
                    <div
                        className="gg-eyebrow"
                        style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}
                    >
                        Your location
                        {fetching && <span className="gg-map-spinner" />}
                    </div>
                    <div className="gg-card-meta">
                        {location
                            ? `${location[0].toFixed(5)}, ${location[1].toFixed(5)}`
                            : "—"}
                    </div>
                </div>
                <button className="gg-panel-close" onClick={onClose} aria-label="Close">
                    ✕
                </button>
            </header>

            <div className="gg-panel-body">

                <div className="gg-score">
                    <div className={`gg-score-value gg-score-${toneFor(risk)}`}>
                        {score ?? "—"}
                        <span className="gg-score-max">/100</span>
                    </div>
                    <div>
                        <span className={`gg-badge gg-badge-${toneFor(risk)}`}>
                            {risk || "Unknown"}
                        </span>
                        <p className="gg-card-text">
                            {safetyScore?.message || "No score for this area yet."}
                        </p>
                        <div className="gg-card-meta" style={{ marginTop: 6 }}>
                            {safetyScore?.crimeCount ?? 0} reports in the surrounding area
                        </div>
                    </div>
                </div>

                {safeRoute && (
                    <Section title="Your route">

                        <div className="gg-route-ends">
                            <div className="gg-route-end">
                                <i className="gg-dot gg-dot-me" />
                                <span>{safeRoute.from || "Your pin"}</span>
                            </div>
                            <div className="gg-route-end">
                                <i className="gg-dot gg-dot-dest" />
                                <span>{safeRoute.to || "Destination"}</span>
                            </div>
                        </div>

                        <div className="gg-modes">
                            {MODES.map((m) => (
                                <button
                                    key={m.value}
                                    className={`gg-mode${travelMode === m.value ? " is-active" : ""}`}
                                    onClick={() => onTravelMode(m.value)}
                                    title={m.label}
                                >
                                    <span className="gg-mode-icon">{m.icon}</span>
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {safeRoute.options?.length > 0 ? (
                            <div className="gg-options">
                                {safeRoute.options.map((o, i) => (
                                    <button
                                        key={o.id}
                                        className={`gg-option${i === selectedRoute ? " is-active" : ""}`}
                                        onClick={() => onSelectRoute(i)}
                                    >
                                        <div className="gg-option-head">
                                            <span className="gg-option-label">
                                                {o.label}
                                            </span>
                                            <span className={`gg-badge gg-badge-${toneFor(o.riskLevel)}`}>
                                                {o.riskLevel}
                                            </span>
                                        </div>
                                        <div className="gg-option-stat">
                                            {o.durationMin} min
                                            <span> · {o.distanceKm} km</span>
                                        </div>
                                        <div className="gg-card-meta">
                                            {o.crimeCount} report{o.crimeCount === 1 ? "" : "s"} near this path
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="gg-field-hint" style={{ marginBottom: 14 }}>
                                Routing service unavailable — showing a direct line,
                                not a travellable path.
                            </div>
                        )}

                        <button
                            className="gg-btn gg-btn-ghost"
                            style={{ width: "100%", marginBottom: 18 }}
                            onClick={onClearDestination}
                        >
                            Clear route
                        </button>

                        {route.warnings?.map((w) => (
                            <div className="gg-card" key={w.street}>
                                {w.level === "High" && <div className="gg-hazard" />}
                                <div className="gg-card-body">
                                    <div className="gg-card-title">{w.street}</div>
                                    <p className="gg-card-text">{w.message}</p>
                                    <div className="gg-card-meta" style={{ marginTop: 6 }}>
                                        {w.count} report{w.count === 1 ? "" : "s"}
                                        {w.highCount > 0 && ` · ${w.highCount} high severity`}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {route.directions?.length > 0 && (
                            <div className="gg-card">
                                <div className="gg-card-body">
                                    <div className="gg-card-meta" style={{ marginBottom: 12 }}>
                                        DIRECTIONS
                                    </div>
                                    <ol className="gg-steps">
                                        {route.directions.map((d, i) => (
                                            <li key={i}>
                                                <span>{d.instruction}</span>
                                                {d.distance && <em>{d.distance}</em>}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </div>
                        )}

                        {safeRoute.approximateGeometry && (
                            <p className="gg-field-hint">
                                Path comes from the road network; {safeRoute.modeLabel?.toLowerCase()}{" "}
                                time is estimated from distance.
                            </p>
                        )}
                    </Section>
                )}

                {trend && (
                    <div className={`gg-trend gg-trend-${trend.direction}`}>
                        <span className="gg-trend-arrow">
                            {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"}
                        </span>
                        <div>
                            <div className="gg-trend-headline">
                                {trend.pct === null
                                    ? "New activity this month"
                                    : trend.direction === "flat"
                                    ? "Holding steady"
                                    : `${trend.pct}% ${trend.direction === "up" ? "more" : "fewer"} reports`}
                            </div>
                            <div className="gg-card-meta">
                                {trend.recent} in the last 30 days vs {trend.prior} the 30 before
                            </div>
                        </div>
                    </div>
                )}

                {profile.length > 0 && (
                    <Section title="What happens here">
                        <div className="gg-card">
                            <div className="gg-card-body">
                                {profile.map((p) => (
                                    <div className="gg-meter" key={p.category}>
                                        <span>{p.category}</span>
                                        <i className="gg-meter-track">
                                            <b
                                                className="gg-meter-fill gg-meter-neutral"
                                                style={{ width: `${(p.count / maxProfile) * 100}%` }}
                                            />
                                        </i>
                                        <em>{p.count}</em>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Section>
                )}

                <Section title="Most serious nearby" count={crimes.length}>
                    {crimes.length === 0 && (
                        <div className="gg-empty">Nothing reported within 5&nbsp;km.</div>
                    )}
                    {topCrimes.map((crime) => (
                        <div className="gg-card" key={crime._id}>
                            <div className="gg-card-body gg-card-row">
                                <div>
                                    <div className="gg-card-title">{crime.category}</div>
                                    <p className="gg-card-text">{crime.description}</p>
                                    <div className="gg-card-meta" style={{ marginTop: 6 }}>
                                        {crime.locationName}
                                    </div>
                                </div>
                                <span className={`gg-badge gg-badge-${toneFor(crime.severity)}`}>
                                    {crime.severity}
                                </span>
                            </div>
                        </div>
                    ))}
                    {crimes.length > topCrimes.length && (
                        <div className="gg-card-meta" style={{ textAlign: "center" }}>
                            + {crimes.length - topCrimes.length} more within 5&nbsp;km
                        </div>
                    )}
                </Section>

                <Section title="Nearest police" count={stations.length}>
                    {stations.length === 0 && (
                        <div className="gg-empty">No stations on record.</div>
                    )}
                    {stations.map((station, i) => (
                        <div className="gg-card" key={station._id || i}>
                            <div className="gg-card-body gg-card-row">
                                <div>
                                    <div className="gg-card-title">{station.name}</div>
                                    <div className="gg-card-meta">
                                        {station.distanceKm != null
                                            ? `${station.distanceKm} km · ~${station.walkMinutes} min walk`
                                            : station.address}
                                    </div>
                                    <p className="gg-card-text" style={{ marginTop: 4 }}>
                                        {station.address}
                                    </p>
                                </div>
                                {station.phone && (
                                    <a
                                        className="gg-btn gg-btn-ghost"
                                        href={`tel:${station.phone}`}
                                    >
                                        Call
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </Section>

                {severities.length > 0 && (
                    <Section title="City-wide">
                        <div className="gg-card">
                            <div className="gg-card-body">
                                {severities.map((s) => (
                                    <div className="gg-meter" key={s._id || "unknown"}>
                                        <span>{s._id || "Unspecified"}</span>
                                        <i className="gg-meter-track">
                                            <b
                                                className={`gg-meter-fill gg-meter-${dotFor(s._id)}`}
                                                style={{ width: `${(s.count / maxSeverity) * 100}%` }}
                                            />
                                        </i>
                                        <em>{s.count}</em>
                                    </div>
                                ))}
                                <div className="gg-card-meta" style={{ marginTop: 12 }}>
                                    {crimeCategories?.length || 0} categories reported city-wide
                                </div>
                            </div>
                        </div>
                    </Section>
                )}

                <Section title="Most recent" count={recent.length}>
                    {recent.length === 0 && (
                        <div className="gg-empty">Nothing reported yet.</div>
                    )}
                    {recent.map((crime) => (
                        <div className="gg-recent" key={crime._id}>
                            <i className={`gg-dot gg-dot-${dotFor(crime.severity)}`} />
                            <div>
                                <div className="gg-card-title" style={{ fontSize: 13 }}>
                                    {crime.category}
                                </div>
                                <div className="gg-card-meta">
                                    {crime.locationName} · {crime.userId?.name || "Anonymous"}
                                </div>
                            </div>
                        </div>
                    ))}
                </Section>

            </div>
        </aside>
    );
}
