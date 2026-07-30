const mongoose = require('mongoose')

const sosSchema = new mongoose.Schema({
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    },
    latitude:{
        type: Number,
        required: true
    },
    longitude:{
        type: Number,
        required: true
    },
    status:{
        type: String,
        enum: ["Active","Resolved"],
        default: "Active"
    },
},{
    timestamps: true
})

module.exports = mongoose.model("SOS",sosSchema)