const mongoose = require('mongoose')

const contactSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name:{
        type: String,
        required: true
    },
    // String, not Number: a numeric type silently drops leading zeros
    // and any "+91" prefix. Stored normalized — see utils/phone.js.
    phone:{
        type: String,
        required: true,
        trim: true
    }
},{
    timestamps: true
}
)

module.exports = mongoose.model('Contact',contactSchema)