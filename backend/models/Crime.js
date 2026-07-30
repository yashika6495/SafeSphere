const mongoose = require("mongoose");

const crimeSchema = new mongoose.Schema(
{
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    category: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    locationName: {
        type: String
    },

    latitude: {
        type: Number,
        required: true
    },

    longitude: {
        type: Number,
        required: true
    },

    image: {
        type: String
    },

    severity: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium"
    },

    status: {
        type: String,
        enum: ["Pending", "Verified", "Rejected"],
        default: "Pending"
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model("Crime", crimeSchema);