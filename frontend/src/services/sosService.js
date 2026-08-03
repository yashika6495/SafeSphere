import API from "../api/api";

/**
 * SOS — CURRENTLY A SIMULATION.
 *
 * POST /api/sos writes a row to the SOS collection and returns. It does
 * not send an SMS, an email, a push, or anything else: there is no
 * notification provider wired into the backend at all (no Twilio, no
 * Nodemailer, no push service in package.json).
 *
 * So triggering this records that an SOS happened and nothing more.
 * NOBODY IS CONTACTED. The UI says so explicitly, and it must keep
 * saying so until a real dispatch path exists — a person in danger
 * believing help is coming when it isn't is worse than no button.
 *
 * To make this real you need, roughly:
 *   1. an SMS/voice provider (Twilio et al) with verified sender IDs
 *   2. a backend job that reads the user's contacts and messages them
 *   3. an escalation path to emergency services, which in most
 *      jurisdictions requires formal authorisation — you cannot simply
 *      autodial a police line
 *   4. delivery receipts, retries, and an audit trail
 */
export const triggerSOS = async ({ latitude, longitude }) => {
    const response = await API.post("/sos", { latitude, longitude });
    return response.data;
};

/** Marks the signal in the alerts feed. Also sends nothing. */
export const sendSOSAlert = async ({ latitude, longitude }) => {
    const response = await API.post("/sos/send", { latitude, longitude });
    return response.data;
};
