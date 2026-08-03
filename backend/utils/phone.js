/**
 * Phone handling, server side.
 *
 * Mirrors frontend/src/utils/validators.js. The client copy is a
 * convenience; this one is the actual rule — anything reaching the
 * database goes through here.
 *
 * Numbers are stored as a normalized 10-digit string. Never as a Number:
 * that silently destroys leading zeros and any country-code prefix, and
 * "+91 98765 43210" and "9876543210" have to end up as the same record.
 */

/**
 * Reduces a typed number to its national significant digits, tolerating
 * the ways people actually write them:
 *   "+91 98765 43210", "098765-43210", "(987) 654 3210"
 */
const normalizePhone = (raw) => {
    const digits = String(raw ?? "").replace(/[\s\-().]/g, "");

    if (digits.startsWith("+91")) return digits.slice(3);

    // Only strip a country code when the length says it is one — plenty of
    // valid 10-digit numbers begin with "91".
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);

    return digits;
};

/** Returns "" when valid, otherwise a human-readable reason. */
const validatePhone = (raw) => {
    const value = String(raw ?? "").trim();
    if (!value) return "Phone number is required.";
    if (/[^\d\s\-+().]/.test(value)) return "Phone number must contain digits only.";

    const national = normalizePhone(value);

    if (!/^\d+$/.test(national)) return "That doesn't look like a phone number.";
    if (national.length < 10) return "Phone number is too short.";
    if (national.length > 10) return "Phone number is too long.";
    if (!/^[6-9]/.test(national)) return "Mobile numbers start with 6, 7, 8 or 9.";

    return "";
};

module.exports = { normalizePhone, validatePhone };
