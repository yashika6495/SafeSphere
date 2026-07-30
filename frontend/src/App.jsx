import { Routes, Route } from "react-router-dom";
import CrimeMap from "./pages/CrimeMap";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {

    return (

        <Routes>

            <Route path="/" element={<Login />} />

            <Route path="/login" element={<Login />} />

            <Route path="/register" element={<Register />} />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            
            <Route
                path="/crime-map"
                element={
                    <ProtectedRoute>
                        <CrimeMap />
                    </ProtectedRoute>
                }
            />

        </Routes>

    );
}

export default App;