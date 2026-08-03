import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

/**
 * Gradient density overlay.
 *
 * Replaces the earlier translucent-circle approach: discrete circles
 * read as "here are some markers", while a blended field reads as
 * "this quarter of the city is worse than that one", which is the
 * actual question.
 *
 * Points come from the server's grid aggregation, weighted by severity,
 * so one assault carries more heat than one pickpocketing.
 */
export default function HeatLayer({ cells, maxWeight, visible }) {
    const map = useMap();

    useEffect(() => {
        if (!visible || !cells?.length) return;

        const points = cells.map((c) => [
            c._id.latitude,
            c._id.longitude,
            // Normalised 0-1; the floor keeps isolated reports faintly
            // visible instead of vanishing next to a hotspot.
            Math.max(0.15, c.weight / (maxWeight || 1)),
        ]);

        const layer = L.heatLayer(points, {
            radius: 34,
            blur: 26,
            maxZoom: 16,
            minOpacity: 0.28,
            gradient: {
                0.0: "#1d3b6e",
                0.3: "#3ddc97",
                0.55: "#f4a340",
                0.78: "#e63946",
                1.0: "#ff6b6b",
            },
        }).addTo(map);

        return () => {
            map.removeLayer(layer);
        };
    }, [map, cells, maxWeight, visible]);

    return null;
}
