import { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap
} from "react-leaflet";
import {
    getNearbyCrime,
    getNearbyPoliceStations,
    getSafetyScore,
    getSafetyTips,
    getRecentCrime,
    getSafeRoute,
    getCrimeSeverity,
    getCrimeCategories
} from "../services/mapService";

import LocationSidebar from "../components/LocationSidebar";
import { useMapEvents } from "react-leaflet";
import { Polyline } from "react-leaflet";

function MapClick({ setDestination }) {
    useMapEvents({
        click(e) {
            setDestination([e.latlng.lat, e.latlng.lng]);
        },
    });

    return null;
}

function ChangeView({ center }) {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.setView(center, 15);
        }
    }, [center, map]);

    return null;
}

export default function CrimeMap() {

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [location, setLocation] = useState([19.0760, 72.8777]); 
    const [loading, setLoading] = useState(true);
    const [crimeSeverity, setCrimeSeverity] = useState([]);
    const [crimeCategories, setCrimeCategories] = useState([]);
    const [crimeData, setCrimeData] = useState([]);
    const [policeData, setPoliceData] = useState([]);
    const [safetyScore, setSafetyScore] = useState(null);
    const [tips, setTips] = useState([]);
    const [recentCrime, setRecentCrime] = useState([]);
    const [safeRoute, setSafeRoute] = useState(null);
    const [destination, setDestination] = useState(null);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation([
                    position.coords.latitude,
                    position.coords.longitude
                ]);
                setLoading(false);
            },
            (error) => {
                console.log(error);
                setLoading(false);
            }
        );
    }, []);

    useEffect(() => {
        if (!loading) {
            loadLocationData();
        }
    }, [location, destination, loading]);

    if (loading) {
        return <h2>Getting your location...</h2>;
    }

    const loadLocationData = async () => {
        try {
    
            const latitude = location[0];
            const longitude = location[1];
    
            const crimes = await getNearbyCrime(latitude, longitude);
            const police = await getNearbyPoliceStations(latitude, longitude);
            const score = await getSafetyScore(latitude, longitude);
            const recent = await getRecentCrime();
            // const route = await getSafeRoute(
            //     sourceLatitude,
            //     sourceLongitude,
            //     destinationLatitude,
            //     destinationLongitude
            // );
            let route = null;

            if (destination) {
                route = await getSafeRoute(
                    latitude,
                    longitude,
                    destination[0],
                    destination[1]
                );
            }
            const severity = await getCrimeSeverity();
            const categories = await getCrimeCategories();
    
            let tipData = [];
    
            if (crimes.totalCrimes > 0) {
                const category = crimes.crimes[0].category;
                tipData = await getSafetyTips(category);
            }
    
            setCrimeData(crimes);
            setPoliceData(police);
            setSafetyScore(score);
            setTips(tipData);
            setRecentCrime(recent);
            setSafeRoute(route);
            setCrimeSeverity(severity);
            setCrimeCategories(categories);
    
        } catch (error) {
            console.log(error);
        }
    };

    return (
        
        <MapContainer
            center={location}
            zoom={15}
            style={{
                height: "100vh",
                width: "100%"
            }}
        >
            <ChangeView center={location} />
            <MapClick setDestination={setDestination} />
            
            <TileLayer
            attribution='© OpenStreetMap contributors © CARTO'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            <Marker
            position={location}
            draggable
            eventHandlers={{
                dragend(e) {
                    const marker = e.target;
                    const latlng = marker.getLatLng();
                    setLocation([latlng.lat, latlng.lng]);
                },
                click() {
                    setSidebarOpen(true);
                }
            }}
            />
            
            {destination && (
                <Marker position={destination}>
                    <Popup>Destination</Popup>
                </Marker>
            )}

            {safeRoute?.source && safeRoute?.destination && (
                <Polyline
                    positions={[
                        [
                            safeRoute.source.latitude,
                            safeRoute.source.longitude
                        ],
                        [
                            safeRoute.destination.latitude,
                            safeRoute.destination.longitude
                        ]
                    ]}
                    pathOptions={{
                        color: "green",
                        weight: 5
                    }}
                />
            )}

            <LocationSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                safetyScore={safetyScore}
                crimeData={crimeData}
                tips={tips}
                police={policeData}
                recentCrime={recentCrime}
                safeRoute={safeRoute}
            />
            </MapContainer>       
    );
}