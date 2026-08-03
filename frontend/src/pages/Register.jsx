import { useState } from "react";
import { registerUser } from "../api/authApi";
import { Link, useNavigate } from "react-router-dom";
import MapBackdrop from "../components/MapBackdrop";
import {
    validateName,
    validateEmail,
    validatePhone,
    validatePassword,
    normalizePhone,
    runValidators,
} from "../utils/validators";

const RULES = {
    name: validateName,
    email: validateEmail,
    phone: validatePhone,
    password: validatePassword,
};

const Register = () => {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Only re-validate a field the user has already left once, so
        // errors don't appear while they're still typing the first time.
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
        setTouched({ name: true, email: true, phone: true, password: true });

        if (Object.keys(errors).length > 0) return;

        setSubmitting(true);

        try {
            await registerUser({
                ...formData,
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: normalizePhone(formData.phone),
            });
            navigate("/login");

        } catch (err) {
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
                <h1 className="gg-title gg-rise gg-rise-2">Create account</h1>
                <p className="gg-subtitle gg-rise gg-rise-2">
                    Set up your profile so trusted contacts can be reached
                    the moment you need them.
                </p>

                {error && (
                    <div className="gg-error-banner" role="alert">{error}</div>
                )}

                <div className="gg-card gg-card-glass gg-rise gg-rise-3">
                    <div className="gg-card-body">
                        <form onSubmit={handleSubmit} className="gg-form-grid" noValidate>

                            {field("name", {
                                type: "text",
                                placeholder: "Full name",
                                autoComplete: "name",
                            })}

                            {field("email", {
                                type: "email",
                                placeholder: "Email",
                                autoComplete: "email",
                            })}

                            {field("phone", {
                                type: "tel",
                                inputMode: "numeric",
                                placeholder: "Phone number",
                                autoComplete: "tel",
                                maxLength: 18,
                            })}

                            {field("password", {
                                type: "password",
                                placeholder: "Password",
                                autoComplete: "new-password",
                            })}

                            {!fieldErrors.password && (
                                <span className="gg-field-hint">
                                    At least 8 characters.
                                </span>
                            )}

                            <button
                                type="submit"
                                className="gg-btn gg-btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? "Creating account…" : "Create account"}
                            </button>

                        </form>
                    </div>
                </div>

                <p className="gg-auth-footer gg-rise gg-rise-4">
                    Already have an account?{" "}
                    <Link to="/login" className="gg-link">Sign in</Link>
                </p>

            </div>
        </div>
    );
};

export default Register;
