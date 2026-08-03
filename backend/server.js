const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");

dotenv.config();
connectDB();

const authRoutes = require('./routes/authRoutes')
const crimeRoutes = require('./routes/crimeRoutes')
const contactRoutes = require('./routes/contactRoutes')
const sosRoutes = require('./routes/sosRoutes');
const alertRoutes = require('./routes/alertRoutes');
const safetyRoutes = require('./routes/safetyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const routeRoutes = require("./routes/routeRoutes");
const policeRoutes = require("./routes/policeRoutes");
const geocodeRoutes = require("./routes/geocodeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("API Running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/crimes", crimeRoutes);
app.use("/api/contacts", contactRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/safety-score',safetyRoutes);
app.use('/api/safety',safetyRoutes);
app.use('/api/admin',adminRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/police",policeRoutes);
app.use("/api/geocode",geocodeRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});