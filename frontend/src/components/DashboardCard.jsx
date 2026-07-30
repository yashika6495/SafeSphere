export default function DashboardCard({
    title,
    value,
    icon,
    color
}) {

    return (

        <div className={`rounded-xl shadow-lg p-3 ${color}`}>
            <div className="flex justify-between items-center">
                <div>
                    <p>{title}</p>
                    <h2 className="text-3xl font-bold">
                        {value}
                    </h2>
                </div>
                <div className="text-5xl">
                    {icon}
                </div>
            </div>
        </div>
    );

}