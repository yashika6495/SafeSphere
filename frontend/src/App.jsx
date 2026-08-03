import { Routes, Route, Navigate } from "react-router-dom";
import CrimeMap from "./pages/CrimeMap";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

/**
 * Sends an already-signed-in visitor straight to the map instead of
 * showing them the login form again.
 */
function PublicOnly({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    return user ? <Navigate to="/map" replace /> : children;
}

function App() {

    return (

        <Routes>

            <Route
                path="/login"
                element={
                    <PublicOnly>
                        <Login />
                    </PublicOnly>
                }
            />

            <Route
                path="/register"
                element={
                    <PublicOnly>
                        <Register />
                    </PublicOnly>
                }
            />

            {/* The map is the app. A signed-in user lands here. */}
            <Route
                path="/map"
                element={
                    <ProtectedRoute>
                        <CrimeMap />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                }
            />

            <Route path="/" element={<Navigate to="/map" replace />} />

            {/* Old entry points, kept so existing links and bookmarks work.
                The counter dashboard was platform-wide admin data that meant
                nothing to a user, so it no longer has a route. */}
            <Route path="/dashboard" element={<Navigate to="/map" replace />} />
            <Route path="/crime-map" element={<Navigate to="/map" replace />} />

            <Route path="*" element={<Navigate to="/map" replace />} />

        </Routes>

    );
}

export default App;
