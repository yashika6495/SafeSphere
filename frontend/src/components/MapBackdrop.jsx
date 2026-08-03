import {
    GRIDS,
    ARTERIALS,
    SECONDARY,
    ROUTES,
    BEACONS,
    ZONES,
    PARKS,
    WATER,
    toPath,
} from "../utils/cityMap";

/**
 * Generated street map behind the auth screens.
 *
 * Geometry lives in utils/cityMap.js so it can also be rasterised
 * headlessly — the layout was tuned by rendering it to PNG and looking
 * at the result rather than by guessing.
 *
 * Drawn the way real tiles are: land, then land use, then roads in three
 * weights with every casing beneath every fill so junctions merge, then
 * the routes on top.
 *
 * Routes are slices of the arterial arrays, so the travelling pulse
 * physically cannot leave the roads it runs along.
 */
export default function MapBackdrop() {
    const minorGrid = (weightClass) =>
        GRIDS.map((g) => {
            const paths = g.lines.map((l) => (
                <path key={l} className={weightClass} d={l} />
            ));
            // Only the older quarter needs clipping; the city grid is
            // already generated within bounds.
            return g.clip ? (
                <g key={g.key} clipPath={`url(#gg-clip-${g.key})`}>{paths}</g>
            ) : (
                <g key={g.key}>{paths}</g>
            );
        });

    return (
        <div className="gg-backdrop" aria-hidden="true">
            <svg
                className="gg-backdrop-svg"
                viewBox="0 0 1200 800"
                preserveAspectRatio="xMidYMid slice"
                focusable="false"
            >
                <defs>
                    {GRIDS.filter((g) => g.clip).map((g) => (
                        <clipPath key={g.key} id={`gg-clip-${g.key}`}>
                            <path d={g.clip} />
                        </clipPath>
                    ))}
                </defs>

                <rect className="gg-map-land" x="0" y="0" width="1200" height="800" />

                {ZONES.map((d) => (
                    <path key={d} className="gg-map-zone" d={d} />
                ))}
                {PARKS.map((d) => (
                    <path key={d} className="gg-map-park" d={d} />
                ))}
                <path className="gg-map-water" d={WATER} />

                {/* Casings first, across all three weights */}
                <g className="gg-road-casing">{minorGrid("gg-road-minor")}</g>
                <g className="gg-road-casing">
                    {SECONDARY.map((d) => (
                        <path key={d} className="gg-road-secondary" d={d} />
                    ))}
                    {ARTERIALS.map((d) => (
                        <path key={d} className="gg-road-major" d={d} />
                    ))}
                </g>

                {/* Then all fills, so junctions merge instead of stacking */}
                <g className="gg-road-fill">{minorGrid("gg-road-minor")}</g>
                <g className="gg-road-fill">
                    {SECONDARY.map((d) => (
                        <path key={d} className="gg-road-secondary" d={d} />
                    ))}
                    {ARTERIALS.map((d) => (
                        <path key={d} className="gg-road-major" d={d} />
                    ))}
                </g>

                {ROUTES.map((r) => {
                    const d = toPath(r.points);
                    return (
                        <g key={r.tone} className={`gg-route gg-route-${r.tone}`}>
                            <path className="gg-route-bed" d={d} pathLength="1" />
                            <path
                                className="gg-route-pulse"
                                d={d}
                                pathLength="1"
                                style={{
                                    animationDuration: r.duration,
                                    animationDelay: r.delay,
                                }}
                            />
                        </g>
                    );
                })}

                {BEACONS.map((b) => (
                    <g key={b.tone} className={`gg-beacon gg-beacon-${b.tone}`}>
                        <circle
                            className="gg-beacon-ring"
                            cx={b.x.toFixed(1)}
                            cy={b.y.toFixed(1)}
                            r="6"
                            style={{ animationDelay: b.delay }}
                        />
                        <circle
                            className="gg-beacon-dot"
                            cx={b.x.toFixed(1)}
                            cy={b.y.toFixed(1)}
                            r="3.5"
                        />
                    </g>
                ))}
            </svg>

            <div className="gg-backdrop-veil" />
        </div>
    );
}
