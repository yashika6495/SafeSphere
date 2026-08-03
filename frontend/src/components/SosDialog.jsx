import { useEffect, useRef, useState } from "react";
import { triggerSOS, sendSOSAlert } from "../services/sosService";

const HOLD_MS = 2000;

/**
 * Emergency trigger — SIMULATED.
 *
 * Nothing here contacts anyone. The backend records the signal and stops;
 * there is no SMS/voice provider wired in. Every state of this dialog
 * says so, on purpose: a safety app that implies help is on the way when
 * it isn't is more dangerous than one with no button at all.
 *
 * Hold-to-confirm rather than a single tap, because an SOS fired by a
 * pocket press trains people to distrust the button.
 */
export default function SosDialog({ open, onClose, location, contacts, station }) {
    const [phase, setPhase] = useState("armed"); // armed | sending | sent | error
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");

    const holdTimer = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        if (open) {
            setPhase("armed");
            setProgress(0);
            setError("");
        }
        return () => {
            clearTimeout(holdTimer.current);
            cancelAnimationFrame(rafRef.current);
        };
    }, [open]);

    if (!open) return null;

    const fire = async () => {
        setPhase("sending");
        try {
            // Both are inert on the server — see services/sosService.js.
            await triggerSOS({ latitude: location[0], longitude: location[1] });
            await sendSOSAlert({ latitude: location[0], longitude: location[1] });
            setPhase("sent");
        } catch (err) {
            setError(
                err.response?.data?.message || "Couldn't record the signal."
            );
            setPhase("error");
        }
    };

    const startHold = () => {
        if (phase !== "armed") return;
        const started = Date.now();

        const tick = () => {
            const pct = Math.min(1, (Date.now() - started) / HOLD_MS);
            setProgress(pct);
            if (pct < 1) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        holdTimer.current = setTimeout(fire, HOLD_MS);
    };

    const cancelHold = () => {
        clearTimeout(holdTimer.current);
        cancelAnimationFrame(rafRef.current);
        if (phase === "armed") setProgress(0);
    };

    return (
        <div className="gg-modal-scrim" onMouseDown={onClose}>
            <div
                className="gg-modal gg-modal-sos"
                role="alertdialog"
                aria-modal="true"
                aria-label="Emergency SOS"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="gg-hazard" />

                <div className="gg-sos-sim">
                    Simulation — this sends no messages to anyone
                </div>

                <div className="gg-modal-body">

                    {phase === "armed" && (
                        <>
                            <h2 className="gg-modal-title" style={{ textAlign: "center" }}>
                                Hold to send SOS
                            </h2>
                            <p className="gg-card-text" style={{ textAlign: "center", margin: 0 }}>
                                Press and hold for two seconds.
                            </p>

                            <button
                                className="gg-sos-button"
                                onMouseDown={startHold}
                                onMouseUp={cancelHold}
                                onMouseLeave={cancelHold}
                                onTouchStart={startHold}
                                onTouchEnd={cancelHold}
                            >
                                <svg className="gg-sos-ring" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="54" />
                                    <circle
                                        cx="60"
                                        cy="60"
                                        r="54"
                                        className="gg-sos-ring-fill"
                                        style={{
                                            strokeDasharray: 339.3,
                                            strokeDashoffset: 339.3 * (1 - progress),
                                        }}
                                    />
                                </svg>
                                <span>SOS</span>
                            </button>

                            <div className="gg-sos-would">
                                <div className="gg-card-meta" style={{ marginBottom: 10 }}>
                                    WOULD NOTIFY
                                </div>
                                {contacts?.length ? (
                                    contacts.map((c) => (
                                        <div className="gg-sos-row" key={c._id}>
                                            <i className="gg-dot gg-dot-low" />
                                            <span>{c.name}</span>
                                            <em>{c.phone}</em>
                                        </div>
                                    ))
                                ) : (
                                    <div className="gg-sos-row gg-sos-row-empty">
                                        No emergency contacts saved yet — add them
                                        from your profile.
                                    </div>
                                )}
                                {station && (
                                    <div className="gg-sos-row">
                                        <i className="gg-dot gg-dot-police" />
                                        <span>{station.name}</span>
                                        <em>{station.distanceKm} km</em>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {phase === "sending" && (
                        <div className="gg-sos-state">
                            <span className="gg-map-spinner" />
                            <p className="gg-card-text">Recording signal…</p>
                        </div>
                    )}

                    {phase === "sent" && (
                        <div className="gg-sos-state">
                            <h2 className="gg-modal-title">Signal recorded</h2>
                            <p className="gg-card-text" style={{ textAlign: "center" }}>
                                Your location was saved to the SOS log at{" "}
                                <b>
                                    {location[0].toFixed(5)}, {location[1].toFixed(5)}
                                </b>
                                .
                            </p>

                            <div className="gg-sos-notreal">
                                <b>No one was contacted.</b> There is no SMS or
                                calling provider connected to this app yet, so
                                nothing was sent to your contacts or to any police
                                station. In a real emergency, call your local
                                emergency number directly.
                            </div>

                            <div className="gg-sos-would">
                                <div className="gg-card-meta" style={{ marginBottom: 10 }}>
                                    WOULD HAVE BEEN NOTIFIED
                                </div>
                                {contacts?.map((c) => (
                                    <div className="gg-sos-row" key={c._id}>
                                        <i className="gg-dot gg-dot-low" />
                                        <span>{c.name}</span>
                                        <em>{c.phone}</em>
                                    </div>
                                ))}
                                {station && (
                                    <div className="gg-sos-row">
                                        <i className="gg-dot gg-dot-police" />
                                        <span>{station.name}</span>
                                        <em>{station.phone}</em>
                                    </div>
                                )}
                            </div>

                            <button
                                className="gg-btn gg-btn-ghost"
                                style={{ width: "100%" }}
                                onClick={onClose}
                            >
                                Close
                            </button>
                        </div>
                    )}

                    {phase === "error" && (
                        <div className="gg-sos-state">
                            <div className="gg-error-banner">{error}</div>
                            <button
                                className="gg-btn gg-btn-ghost"
                                style={{ width: "100%" }}
                                onClick={onClose}
                            >
                                Close
                            </button>
                        </div>
                    )}

                    {phase === "armed" && (
                        <button
                            className="gg-btn gg-btn-ghost"
                            style={{ width: "100%" }}
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
