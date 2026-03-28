export function TelemetryTable({ events }) {
    return (
        <div className="border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-full max-h-[600px]">
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/30 flex justify-between items-center">
                <h3 className="text-sm font-medium text-zinc-200">Raw Telemetry</h3>
                <span className="text-xs font-mono text-zinc-500">{events.length} Logs</span>
            </div>

            <div className="overflow-y-auto overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="sticky top-0 bg-black text-zinc-500 text-xs border-b border-zinc-800 z-10">
                        <tr>
                            <th className="px-4 py-2 font-medium w-12 border-r border-zinc-800/50">#</th>
                            <th className="px-4 py-2 font-medium">Timestamp (Local)</th>
                            <th className="px-4 py-2 font-medium">From</th>
                            <th className="px-4 py-2 font-medium">To</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {events.map((ev, i) => (
                            <tr key={i} className="hover:bg-zinc-900/50 transition-colors">
                                <td className="px-4 py-2.5 text-zinc-600 font-mono text-xs border-r border-zinc-800/50">
                                    {i.toString().padStart(2, '0')}
                                </td>
                                <td className="px-4 py-2.5 text-zinc-400 font-mono text-xs">
                                    {new Date(ev.timestamp).toLocaleString(undefined, {
                                        weekday: 'short', month: 'short', day: '2-digit',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </td>
                                <td className="px-4 py-2.5 text-zinc-500">{ev.from}</td>
                                <td className="px-4 py-2.5 text-zinc-200 font-medium">{ev.to}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}