const User = require('../models/User')
const Alert = require('../models/Alert')
const Crime = require('../models/Crime')
const SOS = require('../models/SOS')

const getDashBoardStats = async (req,res) => {
    try {
        const totalUser = await User.countDocuments()

        const totalCrimes = await Crime.countDocuments()

        const totalSOS = await SOS.countDocuments()

        const activeAlerts = await Alert.countDocuments({
            status:"Active"
        });

        const resolvedAlerts = await Alert.countDocuments({
            status:"Resolved"
        });

        res.status(200).json({
            totalUser,
            totalCrimes,
            totalSOS,
            activeAlerts,
            resolvedAlerts
        })

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

const getCrimeCategoryStats = async (req,res) => {
    try {
        const stats = await Crime.aggregate([
            {
                $group:{
                    _id:"$category",
                    count:{
                        $sum:1
                    }
                }
            }
        ]);
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({
            message:error.message
        });
    }
}

const getCrimeSeverityStats = async (req,res) => {
    try{
        const stats = await Crime.aggregate([
            {
                $group:{
                    _id:"$severity",
                    count:{
                        $sum:1
                    }
                }
            }
        ]);

        res.status(200).json(stats);

    }catch(error){
        res.status(500).json({
            message:error.message
        });

    }
};

const getRecentCrimes = async (req,res) =>{
    try{
        const crimes = await Crime.find()
        .sort({createdAt : -1})
        .limit(5)
        .populate("userId","name email")
        
        res.status(200).json(crimes)
    }catch(error){
        res.status(500).json({
            message: error.message
        })
    }
}

module.exports = {getDashBoardStats,getCrimeCategoryStats,getCrimeSeverityStats,getRecentCrimes}