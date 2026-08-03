/**
 * Transient warnings that surface as someone walks a route.
 *
 * Stacked bottom-left, clear of the report button and the panel.
 * Each is dismissible; they also expire on their own.
 */
export default function RouteWarnings({ toasts, onDismiss }) {
    if (!toasts.length) return null;

    return (
        <div className="gg-toasts" role="status" aria-live="polite">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`gg-toast gg-toast-${t.level === "High" ? "alert" : "caution"}`}
                >
                    <div className="gg-hazard" />
                    <div className="gg-toast-body">
                        <div className="gg-toast-head">
                            <span className="gg-toast-label">
                                {t.level === "High" ? "Heads up" : "Ahead"}
                            </span>
                            <button
                                className="gg-toast-close"
                                onClick={() => onDismiss(t.id)}
                                aria-label="Dismiss"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="gg-toast-text">{t.message}</p>
                        {t.count > 0 && (
                            <div className="gg-card-meta">
                                {t.count} report{t.count === 1 ? "" : "s"}
                                {t.highCount > 0 && ` · ${t.highCount} high severity`}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
