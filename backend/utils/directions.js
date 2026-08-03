/**
 * Turns an OSRM step into something a person can follow.
 *
 * Raw OSRM gives you {type: "turn", modifier: "right", name: "MG Road"},
 * which rendered as "turn right MG Road (282m)" — technically the data,
 * but not an instruction.
 */

const MODIFIER = {
    "sharp right": "sharp right",
    right: "right",
    "slight right": "slight right",
    straight: "straight",
    "slight left": "slight left",
    left: "left",
    "sharp left": "sharp left",
    uturn: "around",
};

const COMPASS = {
    N: "north", NE: "north-east", E: "east", SE: "south-east",
    S: "south", SW: "south-west", W: "west", NW: "north-west",
};

const bearingToCompass = (deg) => {
    if (typeof deg !== "number") return null;
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return COMPASS[dirs[Math.round(deg / 45) % 8]];
};

const onto = (name) => (name ? ` onto ${name}` : "");
const along = (name) => (name ? ` on ${name}` : "");

const describeStep = (step, { isFirst, isLast } = {}) => {
    const name = step.name || "";
    const type = step.maneuver?.type;
    const modifier = MODIFIER[step.maneuver?.modifier] || step.maneuver?.modifier;

    if (isLast || type === "arrive") {
        return modifier && modifier !== "straight"
            ? `Arrive at your destination, on the ${modifier}`
            : "Arrive at your destination";
    }

    if (isFirst || type === "depart") {
        const heading = bearingToCompass(step.maneuver?.bearing_after);
        return heading
            ? `Head ${heading}${along(name)}`
            : `Start${along(name)}`;
    }

    switch (type) {
        case "turn":
            return modifier === "straight"
                ? `Continue straight${onto(name)}`
                : `Turn ${modifier}${onto(name)}`;

        case "new name":
            return `Continue${onto(name)}`;

        case "continue":
            return modifier && modifier !== "straight"
                ? `Continue ${modifier}${onto(name)}`
                : `Continue${along(name)}`;

        case "merge":
            return `Merge${onto(name)}`;

        case "fork":
            return `Keep ${modifier || "straight"}${onto(name)}`;

        case "end of road":
            return `At the end of the road, turn ${modifier || "ahead"}${onto(name)}`;

        case "on ramp":
            return `Take the ramp${onto(name)}`;

        case "off ramp":
            return `Take the exit${onto(name)}`;

        case "roundabout":
        case "rotary": {
            const exit = step.maneuver?.exit;
            const which = exit ? ` and take exit ${exit}` : "";
            return `At the roundabout${which}${onto(name)}`;
        }

        case "exit roundabout":
        case "exit rotary":
            return `Leave the roundabout${onto(name)}`;

        default:
            return modifier
                ? `Head ${modifier}${onto(name)}`
                : `Continue${along(name)}`;
    }
};

/** Formats a distance the way directions normally read. */
const describeDistance = (metres) => {
    if (metres < 20) return "";
    if (metres < 1000) return `${Math.round(metres / 10) * 10} m`;
    return `${(metres / 1000).toFixed(1)} km`;
};

const buildDirections = (steps = []) =>
    steps.map((step, i) => ({
        instruction: describeStep(step, {
            isFirst: i === 0,
            isLast: i === steps.length - 1,
        }),
        street: step.name || null,
        distance: describeDistance(step.distance || 0),
        metres: Math.round(step.distance || 0),
        modifier: step.maneuver?.modifier || null,
        type: step.maneuver?.type || null,
    }));

module.exports = { buildDirections, describeStep, describeDistance };
