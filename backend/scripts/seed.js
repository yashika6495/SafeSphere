/**
 * Development seed data.
 *
 *   npm run seed
 *
 * Wipes and rebuilds crimes, police stations, alerts, SOS signals and
 * contacts, plus a set of demo users (identified by the @safesphere.demo
 * domain). Accounts you registered yourself are left alone — but they DO
 * receive sample contacts/alerts/SOS so the app has something to show
 * whichever account you log in with.
 *
 * Everything is generated from a fixed PRNG seed, so repeated runs
 * produce byte-identical data.
 */

require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Crime = require("../models/Crime");
const Alert = require("../models/Alert");
const SOS = require("../models/SOS");
const Contact = require("../models/Contact");
const PoliceStation = require("../models/PoliceStation");

const DEMO_DOMAIN = "@safesphere.demo";

// --- Deterministic randomness --------------------------------------

const mulberry32 = (seed) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const rand = mulberry32(20260803);
const pick = (list) => list[Math.floor(rand() * list.length)];
const between = (lo, hi) => lo + rand() * (hi - lo);
const daysAgo = (n) => new Date(Date.now() - n * 86400000);

// --- Reference data ------------------------------------------------

// Every category the safety-tips endpoint knows about, so tips never 404.
const CATEGORIES = [
    "Theft", "Robbery", "Harassment", "Kidnapping", "Assault",
    "Stalking", "Domestic Violence", "Cyber Crime",
    "Chain Snatching", "Eve Teasing",
];

const DESCRIPTIONS = {
    "Theft": "Phone taken from a bag in a crowded market lane.",
    "Robbery": "Two men on a motorcycle demanded cash near the underpass.",
    "Harassment": "Group repeatedly followed and verbally harassed a commuter.",
    "Kidnapping": "Attempted forced entry into a vehicle outside the bus stand.",
    "Assault": "Physical altercation reported outside a late-night eatery.",
    "Stalking": "Same individual followed a resident on three consecutive evenings.",
    "Domestic Violence": "Neighbours reported a recurring domestic disturbance.",
    "Cyber Crime": "Caller impersonated bank staff and requested an OTP.",
    "Chain Snatching": "Chain snatched by a pillion rider near the signal.",
    "Eve Teasing": "Persistent catcalling reported near the college gate.",
};

const REPORTERS = [
    { name: "Aditi Rao",      email: `aditi${DEMO_DOMAIN}`,  phone: "9845012301" },
    { name: "Meera Iyer",     email: `meera${DEMO_DOMAIN}`,  phone: "9845012302" },
    { name: "Sana Qureshi",   email: `sana${DEMO_DOMAIN}`,   phone: "9845012303" },
    { name: "Nikhil Menon",   email: `nikhil${DEMO_DOMAIN}`, phone: "9845012304" },
    { name: "Priya Nair",     email: `priya${DEMO_DOMAIN}`,  phone: "9845012305" },
];

const DEMO_LOGIN = {
    name: "Demo User",
    email: `demo${DEMO_DOMAIN}`,
    phone: "9845010000",
    password: "demo1234",
};

/**
 * Hotspots sit OUTSIDE the city centre's own ±0.05° scoring box on
 * purpose. If every crime clustered at the centre, the safety score
 * would read "High" everywhere and demonstrate nothing — this way the
 * score genuinely varies as you move the map marker around.
 */
const CITIES = [
    {
        name: "Bengaluru",
        lat: 12.9716,
        lng: 77.5946,
        localities: [
            "Rajajinagar", "Vijayanagar", "Malleswaram", "Indiranagar",
            "Koramangala", "Jayanagar", "Basavanagudi", "Yeshwanthpur",
            "Majestic", "MG Road",
        ],
        hotspots: [
            { name: "Majestic bus stand",     dLat:  0.014, dLng:  0.002, count: 16 },
            { name: "KR Market",              dLat: -0.009, dLng:  0.005, count: 13 },
            { name: "Shivajinagar",           dLat:  0.019, dLng:  0.015, count: 11 },
            { name: "Rajajinagar 1st Block",  dLat:  0.029, dLng: -0.033, count: 12 },
            { name: "Yeshwanthpur underpass", dLat:  0.043, dLng: -0.030, count: 10 },
            { name: "Indiranagar 100ft Rd",   dLat:  0.011, dLng:  0.053, count: 12 },
            { name: "Koramangala 5th Block",  dLat: -0.031, dLng:  0.043, count: 9 },
            { name: "Jayanagar 4th Block",    dLat: -0.039, dLng:  0.013, count: 8 },
        ],
        stations: [
            ["Rajajinagar Police Station", "1st Block, Rajajinagar",  0.028, -0.021],
            ["Vijayanagar Police Station", "Maruthi Nagar Main Rd",   0.006, -0.038],
            ["Malleswaram Police Station", "8th Cross, Malleswaram",  0.041, -0.006],
            ["Cubbon Park Police Station", "Kasturba Road",           0.004,  0.012],
            ["Indiranagar Police Station", "CMH Road, Indiranagar",   0.017,  0.068],
            ["Jayanagar Police Station",   "11th Main, 4th Block",   -0.043,  0.014],
            ["Basavanagudi Police Station","Bull Temple Road",       -0.031, -0.012],
            ["Yeshwanthpur Police Station","Tumkur Road",             0.057, -0.031],
        ],
    },
    {
        name: "Mumbai",
        lat: 19.0760,
        lng: 72.8777,
        localities: [
            "Andheri West", "Bandra", "Dadar", "Colaba", "Worli",
            "Kurla", "Byculla", "Lower Parel", "Ghatkopar", "Borivali",
        ],
        hotspots: [
            { name: "Dadar station subway", dLat: -0.056, dLng: -0.032, count: 16 },
            { name: "Byculla bridge",       dLat: -0.074, dLng: -0.006, count: 12 },
            { name: "Lower Parel",          dLat: -0.061, dLng: -0.026, count: 11 },
            { name: "Bandra West market",   dLat:  0.025, dLng: -0.037, count: 13 },
            { name: "Andheri East subway",  dLat:  0.063, dLng:  0.012, count: 12 },
            { name: "Kurla east market",    dLat: -0.007, dLng:  0.051, count: 10 },
            { name: "Ghatkopar station",    dLat:  0.011, dLng:  0.067, count: 9 },
            { name: "Worli sea face",       dLat: -0.047, dLng: -0.053, count: 8 },
        ],
        stations: [
            ["Colaba Police Station",     "Shahid Bhagat Singh Rd",  -0.062, -0.052],
            ["Marine Drive Police Station","Netaji Subhash Rd",      -0.041, -0.048],
            ["Byculla Police Station",    "Clare Road, Byculla",     -0.014, -0.019],
            ["Dadar Police Station",      "Senapati Bapat Marg",      0.049,  0.014],
            ["Bandra Police Station",     "Hill Road, Bandra West",   0.072, -0.028],
            ["Worli Police Station",      "Dr Annie Besant Rd",      -0.056, -0.031],
            ["Kurla Police Station",      "LBS Marg, Kurla West",     0.018,  0.071],
            ["Andheri Police Station",    "Andheri West, SV Road",    0.096, -0.021],
        ],
    },
];

// --- Seeding -------------------------------------------------------

const seedUsers = async () => {
    const hash = await bcrypt.hash(DEMO_LOGIN.password, 10);

    const docs = [
        { ...DEMO_LOGIN, password: hash, isVerified: true },
        ...REPORTERS.map((r) => ({ ...r, password: hash, isVerified: true })),
    ];

    return User.insertMany(docs);
};

const seedStations = async () => {
    const docs = CITIES.flatMap((city) =>
        city.stations.map(([name, address, dLat, dLng], i) => ({
            name,
            address: `${address}, ${city.name}`,
            // Placeholder numbers — never seed a real emergency line.
            phone: `+91 ${city.name === "Mumbai" ? 22 : 80} 4000 ${1001 + i}`,
            latitude: +(city.lat + dLat).toFixed(6),
            longitude: +(city.lng + dLng).toFixed(6),
        }))
    );

    return PoliceStation.insertMany(docs);
};

const seedCrimes = async (reporters) => {
    const docs = [];

    for (const city of CITIES) {
        // Clustered reports around each hotspot
        for (const spot of city.hotspots) {
            for (let i = 0; i < spot.count; i++) {
                const category = pick(CATEGORIES);
                docs.push({
                    userId: pick(reporters)._id,
                    category,
                    description: DESCRIPTIONS[category],
                    locationName: `${spot.name}, ${city.name}`,
                    latitude: +(city.lat + spot.dLat + between(-0.005, 0.005)).toFixed(6),
                    longitude: +(city.lng + spot.dLng + between(-0.005, 0.005)).toFixed(6),
                    severity: pick(["High", "High", "Medium"]),
                    status: pick(["Verified", "Verified", "Pending"]),
                    createdAt: daysAgo(Math.floor(between(1, 60))),
                });
            }
        }

        // Scattered lower-severity reports filling the space between
        // hotspots, so the map reads as a lived-in city rather than a
        // handful of pins. Kept inside ~6km: getNearbyCrimes caps at 5km,
        // so anything further never reaches the map at all.
        for (let i = 0; i < 52; i++) {
            const category = pick(CATEGORIES);
            const angle = between(0, Math.PI * 2);
            const radius = between(0.006, 0.055);
            docs.push({
                userId: pick(reporters)._id,
                category,
                description: DESCRIPTIONS[category],
                locationName: `${pick(city.localities)}, ${city.name}`,
                latitude: +(city.lat + Math.sin(angle) * radius).toFixed(6),
                longitude: +(city.lng + Math.cos(angle) * radius).toFixed(6),
                severity: pick(["Low", "Low", "Medium"]),
                status: pick(["Verified", "Pending", "Rejected"]),
                createdAt: daysAgo(Math.floor(between(1, 60))),
            });
        }
    }

    docs.forEach((d) => { d.updatedAt = d.createdAt; });

    // timestamps:false stops Mongoose overwriting our backdated createdAt.
    return Crime.insertMany(docs, { timestamps: false });
};

const seedPerUser = async (users) => {
    const contacts = [];
    const alerts = [];
    const sosDocs = [];

    for (const user of users) {
        contacts.push(
            { userId: user._id, name: "Amma", phone: "9845090001" },
            { userId: user._id, name: "Ravi (brother)", phone: "9845090002" },
            { userId: user._id, name: "Neha (flatmate)", phone: "9845090003" },
        );

        const city = CITIES[0];
        alerts.push(
            {
                userId: user._id,
                latitude: +(city.lat + 0.012).toFixed(6),
                longitude: +(city.lng + 0.008).toFixed(6),
                locationName: "MG Road metro exit",
                riskLevel: "High",
                message: "Poorly lit stretch, group loitering near the exit.",
                status: "Active",
                createdAt: daysAgo(2),
            },
            {
                userId: user._id,
                latitude: +(city.lat - 0.021).toFixed(6),
                longitude: +(city.lng - 0.014).toFixed(6),
                locationName: "Basavanagudi bus stop",
                riskLevel: "Medium",
                message: "Street lights out for the third night running.",
                status: "Active",
                createdAt: daysAgo(6),
            },
            {
                userId: user._id,
                latitude: +(city.lat + 0.031).toFixed(6),
                longitude: +(city.lng - 0.019).toFixed(6),
                locationName: "Malleswaram 8th Cross",
                riskLevel: "Safe",
                message: "Reported earlier, patrol confirmed the area is clear.",
                status: "Resolved",
                createdAt: daysAgo(19),
            },
        );

        sosDocs.push(
            {
                userId: user._id,
                latitude: +(city.lat + 0.004).toFixed(6),
                longitude: +(city.lng - 0.006).toFixed(6),
                status: "Resolved",
                createdAt: daysAgo(12),
            },
            {
                userId: user._id,
                latitude: +(city.lat - 0.009).toFixed(6),
                longitude: +(city.lng + 0.011).toFixed(6),
                status: "Active",
                createdAt: daysAgo(1),
            },
        );
    }

    alerts.forEach((d) => { d.updatedAt = d.createdAt; });
    sosDocs.forEach((d) => { d.updatedAt = d.createdAt; });

    await Contact.insertMany(contacts);
    await Alert.insertMany(alerts, { timestamps: false });
    await SOS.insertMany(sosDocs, { timestamps: false });

    return { contacts: contacts.length, alerts: alerts.length, sos: sosDocs.length };
};

const run = async () => {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not set. Check backend/.env");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to ${process.env.MONGO_URI}\n`);

    // Wipe everything generated, and only the demo accounts.
    await Promise.all([
        Crime.deleteMany({}),
        PoliceStation.deleteMany({}),
        Alert.deleteMany({}),
        SOS.deleteMany({}),
        Contact.deleteMany({}),
        User.deleteMany({ email: { $regex: `${DEMO_DOMAIN}$` } }),
    ]);
    console.log("Cleared previous seed data.");

    const demoUsers = await seedUsers();
    const keptUsers = await User.find({
        email: { $not: { $regex: `${DEMO_DOMAIN}$` } },
    });

    const stations = await seedStations();
    const crimes = await seedCrimes(demoUsers);
    const perUser = await seedPerUser([...demoUsers, ...keptUsers]);

    console.log(`
  users            ${demoUsers.length} demo (${keptUsers.length} of your own kept)
  policestations   ${stations.length}
  crimes           ${crimes.length}
  contacts         ${perUser.contacts}
  alerts           ${perUser.alerts}
  sos              ${perUser.sos}

  Demo login:  ${DEMO_LOGIN.email}  /  ${DEMO_LOGIN.password}
`);

    await mongoose.disconnect();
};

run().catch(async (err) => {
    console.error("Seed failed:", err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
