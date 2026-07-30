import { useEffect, useState } from "react";
import { getContacts, addContact, deleteContact } from "../api/contactApi";
import "../styles/theme.css";

const Contacts = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ name: "", phone: "" });

    const loadContacts = async () => {
        try {
            const data = await getContacts();
            setContacts(data);
        } catch (err) {
            setError(err.response?.data?.message || "Couldn't load contacts.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContacts();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.phone.trim()) return;

        setSubmitting(true);
        setError("");
        try {
            await addContact(form);
            setForm({ name: "", phone: "" });
            await loadContacts();
        } catch (err) {
            setError(err.response?.data?.message || "Couldn't save contact.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const prev = contacts;
        setContacts(contacts.filter((c) => c._id !== id));
        try {
            await deleteContact(id);
        } catch (err) {
            setContacts(prev);
            setError(err.response?.data?.message || "Couldn't delete contact.");
        }
    };

    return (
        <div className="gg-page">
            <div className="gg-container" style={{ maxWidth: 560 }}>
                <div className="gg-eyebrow">Trusted Circle</div>
                <h1 className="gg-title">Emergency Contacts</h1>
                <p className="gg-subtitle">
                    These are the people notified the moment you trigger an SOS.
                </p>

                {error && <div className="gg-error-banner">{error}</div>}

                <div className="gg-card">
                    <div className="gg-card-body">
                        <form onSubmit={handleSubmit} className="gg-form-grid">
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 10,
                                }}
                            >
                                <input
                                    className="gg-input"
                                    name="name"
                                    placeholder="Contact name"
                                    value={form.name}
                                    onChange={handleChange}
                                />
                                <input
                                    className="gg-input"
                                    name="phone"
                                    placeholder="Phone number"
                                    value={form.phone}
                                    onChange={handleChange}
                                />
                            </div>
                            <button
                                type="submit"
                                className="gg-btn gg-btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? "Adding…" : "Add contact"}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="gg-section-title">
                    Saved contacts ({contacts.length})
                </div>

                {loading && <div className="gg-loading">Loading contacts…</div>}

                {!loading && contacts.length === 0 && (
                    <div className="gg-empty">
                        No emergency contacts yet. Add someone you trust above —
                        they'll be alerted first if you ever need help.
                    </div>
                )}

                {!loading &&
                    contacts.map((contact) => (
                        <div className="gg-card" key={contact._id}>
                            <div className="gg-card-body gg-card-row">
                                <div>
                                    <div className="gg-card-title">
                                        {contact.name}
                                    </div>
                                    <div className="gg-card-meta">
                                        {contact.phone}
                                    </div>
                                </div>
                                <button
                                    className="gg-btn gg-btn-ghost"
                                    onClick={() => handleDelete(contact._id)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default Contacts;
