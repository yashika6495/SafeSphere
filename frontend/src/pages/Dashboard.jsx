import { useEffect,useState } from "react";
import { Link } from "react-router-dom";

import {
    FaUsers,
    FaExclamationTriangle,
    FaBell,
    FaPhoneAlt
} from "react-icons/fa"

import DashboardCard from "../components/DashboardCard";
import { getDashBoardStats } from "../services/adminService";

export default function Dashboard() {

    const [stats,setStats] = useState({
        totalUser: 0,
        totalCrimes: 0,
        totalSOS: 0,
        activeAlerts: 0,
        resolvedAlerts: 0,
    })

    const [loading,setLoading] = useState(true)

    useEffect(()=>{
        fetchDashboard();
    },[])

    const fetchDashboard = async () => {
        try {
            const data = await getDashBoardStats()
            setStats(data)
        } catch (error) {
            console.log(error)
        }finally{
            setLoading(false)
        }
    }

    if(loading){
        return (
            <div className="flex justify-center items-center h-screen">
                <h1 className="text-3xl font-bold">
                    Loading Dashboard...
                </h1>
            </div>
        )
    }

    return (

        <div className="min-h-screen bg-slate-900 text-white p-10">

            <h1 className="text-4xl font-bold mb-10" >

                <center>SafeSphere Dashboard</center>

            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                <DashboardCard

                    title="Total Users"

                    value={stats.totalUser}

                    icon={<FaUsers />}

                    color="bg-blue-600"

                />

                <DashboardCard

                    title="Total Crimes"

                    value={stats.totalCrimes}

                    icon={<FaExclamationTriangle />}

                    color="bg-red-600"

                />

                <DashboardCard

                    title="SOS Requests"

                    value={stats.totalSOS}

                    icon={<FaPhoneAlt />}

                    color="bg-orange-600"

                />

                <DashboardCard

                    title="Active Alerts"

                    value={stats.activeAlerts}

                    icon={<FaBell />}

                    color="bg-green-600"

                />

                <DashboardCard

                    title="Resolved Alerts"

                    value={stats.resolvedAlerts}

                    icon={<FaBell />}

                    color="bg-purple-600"

                />

            </div>
            <div className="mt-10">
                <Link
                    to="/crime-map"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg"
                >
                    Open Crime Map
                </Link>
            </div>

        </div>

    );
}