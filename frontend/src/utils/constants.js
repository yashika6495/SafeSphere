/**
 * Shared option lists.
 *
 * CRIME_CATEGORIES must stay in sync with the keys in
 * backend/controllers/safetyController.js — the safety-tips lookup is
 * keyed by exactly these strings and 404s on anything else.
 */

export const CRIME_CATEGORIES = [
    "Theft",
    "Robbery",
    "Harassment",
    "Kidnapping",
    "Assault",
    "Stalking",
    "Domestic Violence",
    "Cyber Crime",
    "Chain Snatching",
    "Eve Teasing",
];

export const SEVERITIES = [
    {
        value: "Low",
        label: "Low",
        hint: "Happened, but nobody was in immediate danger.",
    },
    {
        value: "Medium",
        label: "Medium",
        hint: "Threatening or repeated — worth avoiding the area.",
    },
    {
        value: "High",
        label: "High",
        hint: "Violent or dangerous. Others should stay away.",
    },
];
