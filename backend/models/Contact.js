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
    phone:{
        type: Number,
        required: true
    }
},{
    timestamps: true
}
)

module.exports = mongoose.model('Contact',contactSchema)