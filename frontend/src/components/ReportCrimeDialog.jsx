import { useEffect, useState } from "react";
import { reportCrime } from "../services/crimeService";
import { CRIME_CATEGORIES, SEVERITIES } from "../utils/constants";
import Select from "./Select";

/**
 * Files a report at whatever coordinate the map pin is currently on.
 *
 * Location is taken from the pin rather than asked for: someone
 * reporting an incident should not be typing latitudes.
 */
export default function ReportCrimeDialog({ open, onClose, location, onReported }) {

    const [form, setForm] = useState({
        category: "",
        severity: "Medium",
        description: "",
        locationName: "",
    });

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setForm({
                category: "",
                severity: "Medium",
                description: "",
                locationName: "",
            });
            setError("");
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    const change = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();

        if (!form.category) return setError("Pick what happened.");
        if (form.description.trim().length < 10) {
            return setError("Add a little more detail — at least a sentence.");
        }

        setSubmitting(true);
        setError("");

        try {
            await reportCrime({
                ...form,
                description: form.description.trim(),
                locationName: form.locationName.trim(),
                latitude: location[0],
                longitude: location[1],
            });
            onReported();
            onClose();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                (err.response
                    ? `Couldn't file the report (${err.response.status}).`
                    : "Can't reach the server.")
            );
        } finally {
            setSubmitting(false);
        }
    };

    const activeSeverity = SEVERITIES.find((s) => s.value === form.severity);

    return (
        <div className="gg-modal-scrim" onMouseDown={onClose}>
            <div
                className="gg-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Report an incident"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="gg-hazard" />

                <header className="gg-modal-head">
                    <div>
                        <div className="gg-eyebrow" style={{ margin: 0 }}>Report</div>
                        <h2 className="gg-modal-title">What happened here?</h2>
                    </div>
                    <button
                        className="gg-panel-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </header>

                <form className="gg-modal-body" onSubmit={submit}>

                    {error && <div className="gg-error-banner" role="alert">{error}</div>}

                    <div className="gg-field">
                        <label className="gg-label" htmlFor="category">
                            Type of incident
                        </label>
                        <Select
                            id="category"
                            value={form.category}
                            options={CRIME_CATEGORIES}
                            placeholder="Choose one…"
                            onChange={(category) =>
                                setForm((f) => ({ ...f, category }))
                            }
                        />
                    </div>

                    <div className="gg-field">
                        <label className="gg-label">How serious?</label>
                        <div className="gg-seg">
                            {SEVERITIES.map((s) => (
                                <button
                                    type="button"
                                    key={s.value}
                                    className={`gg-seg-btn gg-seg-${s.value.toLowerCase()}${
                                        form.severity === s.value ? " is-active" : ""
                                    }`}
                                    onClick={() =>
                                        setForm((f) => ({ ...f, severity: s.value }))
                                    }
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                        <span className="gg-field-hint">{activeSeverity?.hint}</span>
                    </div>

                    <div className="gg-field">
                        <label className="gg-label" htmlFor="description">
                            What happened
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            className="gg-input gg-textarea"
                            rows={4}
                            placeholder="Describe it briefly. Don't include names or anything that identifies people."
                            value={form.description}
                            onChange={change}
                        />
                    </div>

                    <div className="gg-field">
                        <label className="gg-label" htmlFor="locationName">
                            Landmark <span className="gg-optional">optional</span>
                        </label>
                        <input
                            id="locationName"
                            name="locationName"
                            className="gg-input"
                            placeholder="e.g. outside the metro exit"
                            value={form.locationName}
                            onChange={change}
                        />
                    </div>

                    <div className="gg-modal-where">
                        <i className="gg-dot gg-dot-me" />
                        <div>
                            <div className="gg-card-title" style={{ fontSize: 13 }}>
                                Filing at your pin
                            </div>
                            <div className="gg-card-meta">
                                {location[0].toFixed(5)}, {location[1].toFixed(5)}
                                {" — drag the pin to move it"}
                            </div>
                        </div>
                    </div>

                    <div className="gg-modal-actions">
                        <button
                            type="button"
                            className="gg-btn gg-btn-ghost"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="gg-btn gg-btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? "Filing…" : "File report"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
