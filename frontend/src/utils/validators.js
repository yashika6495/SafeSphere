/**
 * Client-side form validation.
 *
 * These are a convenience for the user, not a security control — the
 * API still accepts anything it's sent. Mirror these rules server-side
 * before this goes anywhere near production.
 *
 * Each validator returns "" when valid, or a human-readable message.
 */

/**
 * Reduce a typed phone number to its national significant digits,
 * tolerating the ways people actually write them:
 *   "+91 98765 43210", "098765-43210", "(987) 654 3210"
 */
export const normalizePhone = (raw) => {
    let digits = String(raw || "").replace(/[\s\-().]/g, "");

    if (digits.startsWith("+91")) return digits.slice(3);
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);

    return digits;
};

export const validatePhone = (raw) => {
    const value = String(raw || "").trim();
    if (!value) return "Phone number is required.";

    if (/[^\d\s\-+().]/.test(value)) {
        return "Use digits only — no letters.";
    }

    const national = normalizePhone(value);

    if (!/^\d+$/.test(national)) return "That doesn't look like a phone number.";
    if (national.length < 10) return "Too short — enter all 10 digits.";
    if (national.length > 10) return "Too long — a mobile number is 10 digits.";
    if (!/^[6-9]/.test(national)) return "Mobile numbers start with 6, 7, 8 or 9.";

    return "";
};

export const validateName = (raw) => {
    const value = String(raw || "").trim();
    if (!value) return "Name is required.";
    if (value.length < 2) return "Please enter your full name.";
    return "";
};

export const validateEmail = (raw) => {
    const value = String(raw || "").trim();
    if (!value) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        return "Enter a valid email address.";
    }
    return "";
};

export const validatePassword = (raw) => {
    const value = String(raw || "");
    if (!value) return "Password is required.";
    if (value.length < 8) return "Use at least 8 characters.";
    return "";
};

/** Runs a {field: validatorFn} map over form values. */
export const runValidators = (values, rules) => {
    const errors = {};
    Object.entries(rules).forEach(([field, validate]) => {
        const message = validate(values[field]);
        if (message) errors[field] = message;
    });
    return errors;
};
