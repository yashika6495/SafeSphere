import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../api/profileApi";
import "../styles/theme.css";

const Profile = () => {
    const navigate = useNavigate();
    const auth = useAuth();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getProfile();
                setUser(data);
            } catch (err) {
                setError(
                    err.response?.data?.message || "Couldn't load your profile."
                );
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = () => {
        if (auth?.logout) {
            auth.logout();
        } else {
            localStorage.removeItem("token");
        }
        navigate("/login");
    };

    const initial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

    return (
        <div className="gg-page">
            <div className="gg-container" style={{ maxWidth: 520 }}>
                <div className="gg-eyebrow">Account</div>
                <h1 className="gg-title">Your Profile</h1>
                <p className="gg-subtitle">
                    Details tied to this account and its emergency contacts.
                </p>

                {error && <div className="gg-error-banner">{error}</div>}

                {loading && !error && (
                    <div className="gg-loading">Loading profile…</div>
                )}

                {!loading && user && (
                    <div className="gg-card">
                        <div className="gg-card-body">
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 16,
                                    marginBottom: 20,
                                }}
                            >
                                <div className="gg-avatar">{initial}</div>
                                <div>
                                    <div
                                        className="gg-card-title"
                                        style={{ fontSize: 18 }}
                                    >
                                        {user.name}
                                    </div>
                                    <span className="gg-badge gg-badge-safe">
                                        Active
                                    </span>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gap: 12,
                                    borderTop: "1px solid var(--line)",
                                    paddingTop: 16,
                                }}
                            >
                                <div>
                                    <div className="gg-card-meta">EMAIL</div>
                                    <div style={{ fontSize: 14, marginTop: 2 }}>
                                        {user.email}
                                    </div>
                                </div>
                                <div>
                                    <div className="gg-card-meta">PHONE</div>
                                    <div style={{ fontSize: 14, marginTop: 2 }}>
                                        {user.phone || "Not provided"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    className="gg-btn gg-btn-danger-outline"
                    style={{ width: "100%", marginTop: 8 }}
                    onClick={handleLogout}
                >
                    Log out
                </button>
            </div>
        </div>
    );
};

export default Profile;
