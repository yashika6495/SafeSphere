const User = require('../models/User')

const profile = async(req,res)=>{
    try {
        const user = await User.findById(req.user.id).select("-password")

        if(!user){
            res.json(404).json({
                message: 'User not found'
            })
        }
        res.json(user)
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

module.exports = profile