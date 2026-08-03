import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyCrimes } from "../services/crimeService";
import { getContacts, addContact, deleteContact } from "../api/contactApi";
import "../styles/theme.css";

const toneFor = (severity) =>
    severity === "High" ? "alert" : severity === "Medium" ? "caution" : "safe";

const statusTone = (status) =>
    status === "Verified" ? "safe" : status === "Rejected" ? "alert" : "neutral";

const timeAgo = (iso) => {
    if (!iso) return "";
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    return months === 1 ? "a month ago" : `${months} months ago`;
};

const Profile = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [reports, setReports] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [form, setForm] = useState({ name: "", phone: "" });
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try {
            const [mine, saved] = await Promise.all([
                getMyCrimes(),
                getContacts(),
            ]);
            setReports(Array.isArray(mine) ? mine : []);
            setContacts(Array.isArray(saved) ? saved : []);
        } catch (err) {
            setError(
                err.response?.data?.message || "Couldn't load your account."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const addNewContact = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.phone.trim()) return;

        setSaving(true);
        setError("");
        try {
            await addContact({ name: form.name.trim(), phone: form.phone.trim() });
            setForm({ name: "", phone: "" });
            setContacts(await getContacts());
        } catch (err) {
            setError(err.response?.data?.message || "Couldn't save that contact.");
        } finally {
            setSaving(false);
        }
    };

    const removeContact = async (id) => {
        const previous = contacts;
        setContacts(contacts.filter((c) => c._id !== id));
        try {
            await deleteContact(id);
        } catch (err) {
            setContacts(previous);
            setError(err.response?.data?.message || "Couldn't remove that contact.");
        }
    };

    const signOut = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const initial = user?.name ? user.name.charAt(0).toUpperCase() : "?";
    const verified = reports.filter((r) => r.status === "Verified").length;

    return (
        <div className="gg-page">
            <div className="gg-container" style={{ maxWidth: 680 }}>

                <Link to="/map" className="gg-back">← Back to map</Link>

                <div className="gg-profile-head">
                    <div className="gg-avatar">{initial}</div>
                    <div>
                        <h1 className="gg-title" style={{ marginBottom: 2 }}>
                            {user?.name || "Your account"}
                        </h1>
                        <div className="gg-card-meta">
                            {user?.email}
                            {user?.createdAt && ` · joined ${timeAgo(user.createdAt)}`}
                        </div>
                    </div>
                </div>

                {error && <div className="gg-error-banner" role="alert">{error}</div>}

                <div className="gg-stat-grid">
                    <div className="gg-stat">
                        <div className="gg-stat-value">{reports.length}</div>
                        <div className="gg-stat-label">Reports filed</div>
                    </div>
                    <div className="gg-stat">
                        <div className="gg-stat-value">{verified}</div>
                        <div className="gg-stat-label">Verified</div>
                    </div>
                    <div className="gg-stat">
                        <div className="gg-stat-value">{contacts.length}</div>
                        <div className="gg-stat-label">Contacts</div>
                    </div>
                </div>

                <div className="gg-section-title">Your details</div>
                <div className="gg-card">
                    <div className="gg-card-body">
                        <div className="gg-detail-row">
                            <span className="gg-card-meta">EMAIL</span>
                            <span>{user?.email || "—"}</span>
                        </div>
                        <div className="gg-detail-row">
                            <span className="gg-card-meta">PHONE</span>
                            <span>{user?.phone || "Not provided"}</span>
                        </div>
                        <div className="gg-detail-row" style={{ borderBottom: 0 }}>
                            <span className="gg-card-meta">STATUS</span>
                            <span
                                className={`gg-badge gg-badge-${
                                    user?.isVerified ? "safe" : "neutral"
                                }`}
                            >
                                {user?.isVerified ? "Verified" : "Unverified"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="gg-section-title">Emergency contacts</div>
                <p className="gg-card-text" style={{ marginTop: -8, marginBottom: 14 }}>
                    The people meant to be reached if you trigger an SOS.
                </p>

                <div className="gg-card">
                    <div className="gg-card-body">
                        <form onSubmit={addNewContact} className="gg-contact-form">
                            <input
                                className="gg-input"
                                placeholder="Name"
                                value={form.name}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, name: e.target.value }))
                                }
                            />
                            <input
                                className="gg-input"
                                placeholder="Phone number"
                                inputMode="numeric"
                                value={form.phone}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, phone: e.target.value }))
                                }
                            />
                            <button
                                type="submit"
                                className="gg-btn gg-btn-primary"
                                disabled={saving}
                            >
                                {saving ? "Adding…" : "Add"}
                            </button>
                        </form>
                    </div>
                </div>

                {loading && <div className="gg-loading">Loading…</div>}

                {!loading && contacts.length === 0 && (
                    <div className="gg-empty">
                        No contacts yet. Add someone you'd want reached first.
                    </div>
                )}

                {contacts.map((contact) => (
                    <div className="gg-card" key={contact._id}>
                        <div className="gg-card-body gg-card-row">
                            <div>
                                <div className="gg-card-title">{contact.name}</div>
                                <div className="gg-card-meta">{contact.phone}</div>
                            </div>
                            <button
                                className="gg-btn gg-btn-ghost"
                                onClick={() => removeContact(contact._id)}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}

                <div className="gg-section-title">
                    Your reports {reports.length > 0 && `(${reports.length})`}
                </div>

                {!loading && reports.length === 0 && (
                    <div className="gg-empty">
                        You haven't reported anything yet. Anything you file from
                        the map shows up here.
                    </div>
                )}

                {reports.map((report) => (
                    <div className="gg-card" key={report._id}>
                        <div className="gg-card-body">
                            <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
                                <span className={`gg-badge gg-badge-${toneFor(report.severity)}`}>
                                    {report.severity}
                                </span>
                                <span className={`gg-badge gg-badge-${statusTone(report.status)}`}>
                                    {report.status}
                                </span>
                            </div>
                            <div className="gg-card-title">{report.category}</div>
                            <p className="gg-card-text">{report.description}</p>
                            <div className="gg-card-meta" style={{ marginTop: 7 }}>
                                {report.locationName ||
                                    `${report.latitude}, ${report.longitude}`}
                                {" · "}{timeAgo(report.createdAt)}
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    className="gg-btn gg-btn-danger-outline"
                    style={{ width: "100%", marginTop: 28 }}
                    onClick={signOut}
                >
                    Log out
                </button>

            </div>
        </div>
    );
};

export default Profile;
