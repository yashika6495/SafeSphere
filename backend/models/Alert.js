const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
{
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    latitude: {
        type: Number,
        required: true
    },

    longitude: {
        type: Number,
        required: true
    },

    locationName: {
        type: String
    },

    riskLevel: {
        type: String,
        enum: ["Safe", "Medium", "High"],
        default: "Safe"
    },

    message: {
        type: String
    },

    status: {
        type: String,
        enum: ["Active", "Resolved"],
        default: "Active"
    }
},
{
    timestamps: true
});

module.exports = mongoose.model("Alert", alertSchema);