import { useState } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';

// ✅ Added ticketCreatedAt to the props
export function TelemetryTable({ events, ticketCreatedAt }) {
    const [copied, setCopied] = useState(false);

    // ✅ Combine the creation date with the rest of the events for display
    const displayEvents = ticketCreatedAt
        ? [
            {
                isOrigin: true,
                timestamp: ticketCreatedAt,
                from: 'Ticket Created',
                to: events.length > 0 ? events[0].from : 'System',
            },
            ...events,
        ]
        : events;

    const handleCopyTable = () => {
        if (displayEvents.length === 0) return;

        // Generate a Markdown formatted table
        let markdown = `| # | Timestamp (Local) | Previous Stage | New Stage |\n`;
        markdown += `|---|---|---|---|\n`;

        displayEvents.forEach((ev, i) => {
            // Label the origin as '00', and standardize the rest
            const seq = ev.isOrigin ? '00' : (ticketCreatedAt ? i : i + 1).toString().padStart(2, '0');
            const time = new Date(ev.timestamp).toLocaleString(undefined, {
                weekday: 'short', month: 'short', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            });
            markdown += `| ${seq} | ${time} | ${ev.from} | ${ev.to} |\n`;
        });

        navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col h-full max-h-[850px] shadow-xl bg-zinc-900/40">

            {/* Table Header with Utilities */}
            <div className="px-6 py-5 border-b border-zinc-800/80 bg-zinc-950/50 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-zinc-200">Raw Telemetry</h3>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-medium text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-700/50">
                        {displayEvents.length} Logs
                    </span>

                    <button
                        onClick={handleCopyTable}
                        disabled={displayEvents.length === 0}
                        className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-700/50 hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Copy table as Markdown"
                    >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied MD' : 'Copy Data'}
                    </button>
                </div>
            </div>

            {/* Table Body */}
            <div className="overflow-y-auto overflow-x-auto p-0">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="sticky top-0 bg-zinc-950/95 backdrop-blur text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800/80 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-4 font-semibold w-12">#</th>
                            <th className="px-6 py-4 font-semibold">Local Timestamp</th>
                            <th className="px-6 py-4 font-semibold">From</th>
                            <th className="px-6 py-4 font-semibold">To</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                        {displayEvents.map((ev, i) => {
                            // Label the origin as '00', and standardize the rest
                            const seq = ev.isOrigin ? '00' : (ticketCreatedAt ? i : i + 1).toString().padStart(2, '0');

                            return (
                                <tr
                                    key={i}
                                    className={`transition-colors group ${ev.isOrigin ? 'bg-indigo-950/20 hover:bg-indigo-950/30' : 'hover:bg-zinc-800/40'}`}
                                >
                                    <td className="px-6 py-4 text-zinc-600 font-mono text-xs border-r border-zinc-800/30 tabular-nums">
                                        {seq}
                                    </td>
                                    <td className={`px-6 py-4 font-mono tabular-nums ${ev.isOrigin ? 'text-indigo-300' : 'text-zinc-300'}`}>
                                        {new Date(ev.timestamp).toLocaleString(undefined, {
                                            weekday: 'short', month: 'short', day: '2-digit',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`${ev.isOrigin ? 'text-indigo-400/70' : 'text-zinc-500'} group-hover:text-zinc-400 transition-colors`}>
                                            {ev.from}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`${ev.isOrigin ? 'text-indigo-200 bg-indigo-900/40 border-indigo-700/50' : 'text-zinc-200 bg-zinc-800/50 border-zinc-700/30'} font-medium px-2.5 py-1 rounded-md border`}>
                                            {ev.to}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}