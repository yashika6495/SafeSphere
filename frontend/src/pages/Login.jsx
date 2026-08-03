import { useState } from "react";
import { loginUser } from "../api/authApi";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MapBackdrop from "../components/MapBackdrop";
import { validateEmail, runValidators } from "../utils/validators";

// Deliberately lighter than the register rules: a sign-in form should
// reject empty or malformed input, not re-litigate password policy.
const RULES = {
    email: validateEmail,
    password: (v) => (v ? "" : "Password is required."),
};

const Login = () => {

    const navigate = useNavigate();

    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (touched[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: RULES[name](value) }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        setFieldErrors((prev) => ({ ...prev, [name]: RULES[name](value) }));
    };

    const handleSubmit = async (e) => {

        e.preventDefault();
        setError("");

        const errors = runValidators(formData, RULES);
        setFieldErrors(errors);
        setTouched({ email: true, password: true });

        if (Object.keys(errors).length > 0) return;

        setSubmitting(true);

        try {
            const data = await loginUser({
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            });
            await login(data.token);
            navigate("/map");

        } catch (err) {
            // A server that answers without a JSON body (or doesn't answer
            // at all) leaves err.response undefined — say which it was.
            setError(
                err.response?.data?.message ||
                (err.response
                    ? `Server error (${err.response.status}).`
                    : "Can't reach the server. Is the backend running?")
            );
        } finally {
            setSubmitting(false);
        }
    };

    const field = (name, props) => (
        <div className="gg-field">
            <input
                {...props}
                className={`gg-input${fieldErrors[name] ? " gg-input-invalid" : ""}`}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(fieldErrors[name])}
                aria-describedby={fieldErrors[name] ? `${name}-error` : undefined}
            />
            {fieldErrors[name] && (
                <span className="gg-field-error" id={`${name}-error`} role="alert">
                    {fieldErrors[name]}
                </span>
            )}
        </div>
    );

    return (
        <div className="gg-auth">
            <MapBackdrop />

            <div className="gg-auth-inner">

                <div className="gg-wordmark gg-rise gg-rise-1">SafeSphere</div>
                <h1 className="gg-title gg-rise gg-rise-2">Sign in</h1>
                <p className="gg-subtitle gg-rise gg-rise-2">
                    Your safety network, your emergency contacts, one tap away.
                </p>

                {error && (
                    <div className="gg-error-banner" role="alert">{error}</div>
                )}

                <div className="gg-card gg-card-glass gg-rise gg-rise-3">
                    <div className="gg-card-body">
                        <form onSubmit={handleSubmit} className="gg-form-grid" noValidate>

                            {field("email", {
                                type: "email",
                                placeholder: "Email",
                                autoComplete: "email",
                            })}

                            {field("password", {
                                type: "password",
                                placeholder: "Password",
                                autoComplete: "current-password",
                            })}

                            <button
                                type="submit"
                                className="gg-btn gg-btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? "Signing in…" : "Sign in"}
                            </button>

                        </form>
                    </div>
                </div>

                <p className="gg-auth-footer gg-rise gg-rise-4">
                    Don't have an account?{" "}
                    <Link to="/register" className="gg-link">Register</Link>
                </p>

            </div>
        </div>
    );
};

export default Login;
