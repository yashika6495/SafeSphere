/**
 * Generated street-map geometry for the auth backdrop.
 *
 * Kept as plain data (no JSX) so it can be rendered by the React
 * component AND rasterised headlessly for visual checks.
 *
 * Structure mirrors how real tiles are drawn:
 *   - arterials are splines through shared junction control points
 *   - districts are "ladders" (few sparse main roads, many dense cross
 *     roads), each rotated and clipped to an irregular region
 *   - routes are slices of the arterial arrays, so they cannot drift
 *     off the roads they run along
 */

const SEG = 12;

const catmullRom = (pts) => {
    const n = pts.length;
    const at = (i) => pts[Math.max(0, Math.min(n - 1, i))];
    const out = [];

    for (let i = 0; i < n - 1; i++) {
        const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
        for (let s = 0; s < SEG; s++) {
            const t = s / SEG;
            const t2 = t * t;
            const t3 = t2 * t;
            out.push([
                0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t +
                    (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
                    (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t +
                    (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
                    (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
            ]);
        }
    }
    out.push(pts[n - 1]);
    return out;
};

export const toPath = (points) =>
    "M " + points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ");

// --- City layout ----------------------------------------------------
//
// Two earlier attempts failed for the same reason: streets and roads
// were generated independently, so nothing lined up. Rotating a separate
// grid per district gave a collage of islands sliced at invented seams.
// Offsetting grids off curved roads made parallels fold over themselves
// on bends and ribs fan into starbursts.
//
// A real city is coherent because everything shares ONE framework. So:
// a single grid at one angle covers the map, and the arterials run
// exactly ALONG grid lines — they are the same lines, drawn heavier. One
// diagonal avenue cuts across (every city has one), and an older quarter
// sits at its own angle, but the angle only changes AT a major road,
// which is what makes the change read as deliberate rather than broken.
//
// Everything is built in a local axis-aligned space and rotated once, so
// intersections are exact by construction.

const W = 1200;
const H = 800;
const CX = W / 2;
const CY = H / 2;
const R = 980;               // local half-extent; covers the canvas rotated
const CITY_ANGLE = -13;      // the whole grid's tilt
const DISTRICT_ANGLE = 26;   // the older quarter, across the boundary road

const rot = (x, y, deg) => {
    const r = (deg * Math.PI) / 180;
    const c = Math.cos(r);
    const sn = Math.sin(r);
    return [CX + x * c - y * sn, CY + x * sn + y * c];
};

const fmt = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
const seg = (x1, y1, x2, y2) =>
    `M ${fmt(rot(x1, y1, CITY_ANGLE))} L ${fmt(rot(x2, y2, CITY_ANGLE))}`;

// Arterials sit on these local coordinates. The grid is generated to
// include them, so a main road is always exactly a street line.
const AV_X = [-560, -170, 250, 640];   // avenues, vertical in local space
const ST_Y = [-300, 60, 420];          // streets, horizontal

const BLOCK = 26;    // cross-street spacing: the dense direction
const LONG = 82;    // long-street spacing: the sparse direction

// --- Minor streets --------------------------------------------------
//
// Streets terminate AT major roads rather than running edge to edge.
// That's what stops a grid reading as graph paper: in a real city most
// cross-streets only run a few blocks between two arterials, and only a
// handful go all the way through.
//
// Deterministic hash, not Math.random, so the layout never reshuffles
// between renders.

const hash = (n) => {
    const x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
};

// Candidate stop lines: the canvas edge plus every major road.
const Y_STOPS = [-R, ST_Y[0], ST_Y[1], ST_Y[2], R];
const X_STOPS = [-R, AV_X[0], AV_X[1], AV_X[2], AV_X[3], R];

/** Picks a contiguous run of stops, biased toward shorter streets. */
const span = (stops, seed) => {
    const n = stops.length - 1;
    const a = Math.floor(hash(seed) * n);
    const long = hash(seed + 31) > 0.72;           // a few run right through
    const b = long ? n : Math.min(n, a + 1 + Math.floor(hash(seed + 7) * 2));
    return [stops[a], stops[Math.max(a + 1, b)]];
};

const minor = [];
let k = 0;

for (let x = -R; x <= R; x += BLOCK) {
    if (AV_X.includes(x)) continue;
    let [y0, y1] = span(Y_STOPS, k++);
    // The old quarter has its own grid; don't run through it.
    if (x < AV_X[1]) y1 = Math.min(y1, ST_Y[1]);
    if (y1 > y0) minor.push(seg(x, y0, x, y1));
}

for (let y = -R; y <= R; y += LONG) {
    if (ST_Y.includes(y)) continue;
    let [x0, x1] = span(X_STOPS, k++);
    if (y > ST_Y[1]) x0 = Math.max(x0, AV_X[1]);
    if (x1 > x0) minor.push(seg(x0, y, x1, y));
}

// The old quarter: same construction, its own angle, hinged on the
// corner where the two boundary roads meet.
const dOrigin = rot(AV_X[1], ST_Y[1], CITY_ANGLE);
const dRot = (x, y) => {
    const r = ((CITY_ANGLE + DISTRICT_ANGLE) * Math.PI) / 180;
    const c = Math.cos(r);
    const sn = Math.sin(r);
    return [dOrigin[0] + x * c - y * sn, dOrigin[1] + x * sn + y * c];
};
const dSeg = (x1, y1, x2, y2) =>
    `M ${fmt(dRot(x1, y1))} L ${fmt(dRot(x2, y2))}`;

const district = [];
for (let x = -1100; x <= 0; x += 25) district.push(dSeg(x, 0, x, 1100));
for (let y = 0; y <= 1100; y += 98) district.push(dSeg(-1100, y, 0, y));

export const GRIDS = [
    { key: "city", lines: minor },
    {
        key: "old",
        lines: district,
        clip:
            `M ${fmt(dOrigin)} ` +
            `L ${fmt(rot(AV_X[1], R, CITY_ANGLE))} ` +
            `L ${fmt(rot(-R, R, CITY_ANGLE))} ` +
            `L ${fmt(rot(-R, ST_Y[1], CITY_ANGLE))} Z`,
    },
];

// --- Roads ----------------------------------------------------------
// The same lines as the grid, drawn heavier. That is the whole trick.

export const SECONDARY = [
    seg(AV_X[0], -R, AV_X[0], ST_Y[1]),
    seg(AV_X[3], -R, AV_X[3], R),
    seg(-R, ST_Y[0], R, ST_Y[0]),
    seg(-R, ST_Y[2], AV_X[1], ST_Y[2]),
    dSeg(-640, 0, -640, 1100),
    dSeg(-1100, 392, 0, 392),
];

export const ARTERIALS = [
    seg(AV_X[2], -R, AV_X[2], R),   // main avenue
    seg(-R, ST_Y[1], R, ST_Y[1]),   // main cross street
    seg(AV_X[1], -R, AV_X[1], R),   // the boundary road
    seg(-R, -R * 0.62, R, R * 0.42) // the diagonal every city has
];

// --- Routes ---------------------------------------------------------
// Built from the same local coordinates as the roads, so a route is
// always exactly on top of the road it claims to follow.

const pt = (x, y) => rot(x, y, CITY_ANGLE);

export const ROUTES = [
    {
        tone: "alert", duration: "12s", delay: "0s",
        points: [pt(AV_X[2], -R), pt(AV_X[2], ST_Y[1]), pt(AV_X[1], ST_Y[1]), pt(AV_X[1], R)],
    },
    {
        tone: "safe", duration: "14.5s", delay: "-6s",
        points: [pt(-R, ST_Y[1]), pt(AV_X[2], ST_Y[1]), pt(AV_X[2], ST_Y[0]), pt(R, ST_Y[0])],
    },
    {
        tone: "caution", duration: "17s", delay: "-10s",
        points: [pt(-R, -R * 0.62), pt(R, R * 0.42)],
    },
];

// --- Land use -------------------------------------------------------

export const ZONES = [
    "M 286 140 L 508 198 L 548 292 L 418 318 L 238 238 Z",
    "M 684 240 L 922 252 L 962 372 L 812 400 L 674 320 Z",
    "M 986 420 L 1104 470 L 1126 606 L 996 628 L 946 508 Z",
    "M 190 632 L 432 602 L 462 690 L 220 720 Z",
    "M 690 614 L 866 594 L 886 692 L 708 712 Z",
];

export const PARKS = [
    "M 548 462 C 628 442 718 462 733 507 C 740 552 678 582 603 572 C 540 562 516 497 548 462 Z",
    "M 1128 112 C 1198 92 1263 120 1268 182 L 1268 242 C 1188 254 1118 212 1116 162 Z",
    "M 82 292 C 142 280 192 298 198 336 C 204 374 152 396 102 388 C 60 380 48 314 82 292 Z",
    "M 318 772 C 388 756 440 778 446 814 L 448 880 L 318 880 Z",
];

export const WATER =
    "M 1182 462 C 1155 548 1173 624 1139 708 C 1115 768 1103 818 1109 890";

export const BEACONS = ROUTES.map((r) => ({
    tone: r.tone,
    delay: r.delay,
    x: r.points[0][0],
    y: r.points[0][1],
}));

export const VIEWBOX = { width: 1200, height: 800 };
