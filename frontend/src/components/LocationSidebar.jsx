export default function LocationSidebar({
    open,
    onClose,
    safetyScore,
    crimeData,
    tips,
    police,
    recentCrime
}) {

    if (!open) return null;

    return (
        <div className="absolute top-0 right-0 h-full w-96 bg-white shadow-2xl z-[1000] overflow-y-auto p-5">

            <button
                onClick={onClose}
                className="float-right text-xl font-bold"
            >
                ✕
            </button>

            <h2 className="text-2xl font-bold mb-4">
                Your Location
            </h2>

            <h3 className="font-semibold">Safety Score</h3>

            <p><b>Score:</b> {safetyScore?.score}</p>

            <p><b>Risk:</b> {safetyScore?.riskLevel}</p>

            <p>{safetyScore?.message}</p>

            <p><b>Nearby Crimes:</b> {safetyScore?.crimeCount}</p>

            <h3>Safety Tips</h3>

            {tips?.tips?.length > 0 ? (
                <ul>
                    {tips.tips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                    ))}
                </ul>
            ) : (
                <p>No safety tips available.</p>
            )}

            <hr className="my-4"/>

            <h3 className="font-semibold">Nearby Crime</h3>

            {crimeData?.crimes?.length > 0 ? (
                crimeData.crimes.map((crime) => (
                    <div
                        key={crime._id}
                        className="border rounded p-2 my-2"
                    >
                        <p><b>Category:</b> {crime.category}</p>
                        <p><b>Severity:</b> {crime.severity}</p>
                        <p>{crime.locationName}</p>
                    </div>
                ))
            ) : (
                <p>No nearby crimes.</p>
            )}

        </div>
    );
}