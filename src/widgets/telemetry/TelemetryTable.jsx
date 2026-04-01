import React, { useState, useMemo, useCallback } from 'react';
import { Copy, CheckCircle2, Clock } from 'lucide-react';

export function TelemetryTable({ events = [], ticketCreatedAt }) {
    const [copied, setCopied] = useState(false);

    // 🧠 ENGINEER: Memoize the derived state so we don't recalculate on every re-render
    const displayEvents = useMemo(() => {
        if (!ticketCreatedAt && (!events || events.length === 0)) return [];

        const baseEvents = events || [];
        return ticketCreatedAt
            ? [
                {
                    isOrigin: true,
                    timestamp: ticketCreatedAt,
                    from: 'System Genesis',
                    to: baseEvents.length > 0 ? baseEvents[0].from : 'Unassigned',
                },
                ...baseEvents,
            ]
            : baseEvents;
    }, [events, ticketCreatedAt]);

    const handleCopyTable = useCallback(() => {
        if (displayEvents.length === 0) return;

        let markdown = `| Seq | Local Timestamp | Transition Origin | Target State |\n`;
        markdown += `|---|---|---|---|\n`;

        displayEvents.forEach((ev, i) => {
            const seq = ev.isOrigin ? '00' : (ticketCreatedAt ? i : i + 1).toString().padStart(2, '0');
            const time = new Date(ev.timestamp).toLocaleString(undefined, {
                weekday: 'short', month: 'short', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            markdown += `| ${seq} | ${time} | ${ev.from} | ${ev.to} |\n`;
        });

        navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [displayEvents, ticketCreatedAt]);

    // Empty State Handling
    if (displayEvents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] border border-surface-accent rounded-2xl bg-surface-secondary/20">
                <Clock className="w-8 h-8 text-text-muted mb-3 opacity-50" />
                <p className="text-sm font-medium text-text-secondary">Awaiting Telemetry</p>
                <p className="text-xs text-text-muted mt-1">No transition events recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-h-[850px] border border-surface-accent rounded-2xl overflow-hidden bg-surface-primary shadow-2xl">

            {/* 🎩 DESIGNER: The Header acts as the control surface. */}
            <header className="px-6 py-5 border-b border-surface-accent bg-surface-secondary/50 flex justify-between items-center backdrop-blur-md z-20">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold tracking-wide text-text-primary uppercase">Event Ledger</h3>
                    <span className="flex items-center justify-center px-2 py-0.5 rounded-md bg-surface-accent text-text-secondary text-[10px] font-mono border border-surface-accent/50">
                        {displayEvents.length} RECORDS
                    </span>
                </div>

                <button
                    onClick={handleCopyTable}
                    disabled={displayEvents.length === 0}
                    className="group relative flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                             bg-surface-secondary border-surface-accent hover:border-text-muted hover:text-white text-text-secondary"
                    aria-label="Export to Markdown"
                >
                    {copied ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald animate-in zoom-in duration-200" />
                    ) : (
                        <Copy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                    )}
                    <span className={copied ? "text-brand-emerald" : ""}>
                        {copied ? 'Markdown Copied' : 'Export .MD'}
                    </span>
                </button>
            </header>

            {/* 💻 ENGINEER: The scroll container. Custom scrollbar hidden via Tailwind utilities usually applied globally, but layout is strictly contained. */}
            <div className="overflow-y-auto overflow-x-auto flex-1 overscroll-contain pb-6">
                <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                    <thead className="sticky top-0 bg-surface-primary/95 backdrop-blur-md text-text-muted text-[10px] uppercase tracking-widest border-b border-surface-accent z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-4 font-semibold w-16">Seq</th>
                            <th className="px-6 py-4 font-semibold">Local Timestamp</th>
                            <th className="px-6 py-4 font-semibold">Origin State</th>
                            <th className="px-6 py-4 font-semibold">Target State</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-accent/30">
                        {displayEvents.map((ev, i) => {
                            const seq = ev.isOrigin ? '00' : (ticketCreatedAt ? i : i + 1).toString().padStart(2, '0');

                            // Native staggered entrance animation logic
                            const staggerDelay = `${i * 0.02}s`;

                            return (
                                <tr
                                    key={`${ev.timestamp}-${i}`}
                                    className={`group transition-colors duration-200 animate-fade-in
                                        ${ev.isOrigin
                                            ? 'bg-brand-indigo/5 hover:bg-brand-indigo/10'
                                            : 'hover:bg-surface-secondary/40'
                                        }`}
                                    style={{ animationFillMode: 'both', animationDelay: staggerDelay }}
                                >
                                    <td className="px-6 py-3.5 text-text-muted font-mono text-xs border-r border-surface-accent/30 tabular-nums">
                                        {seq}
                                    </td>

                                    <td className={`px-6 py-3.5 font-mono text-xs tabular-nums tracking-tight
                                        ${ev.isOrigin ? 'text-brand-indigo shadow-brand-indigo/20' : 'text-text-secondary group-hover:text-text-primary transition-colors'}`}>
                                        {new Date(ev.timestamp).toLocaleString(undefined, {
                                            month: 'short', day: '2-digit',
                                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                                        })}
                                    </td>

                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${ev.isOrigin ? 'bg-brand-indigo/50' : 'bg-surface-accent'}`} />
                                            <span className={`${ev.isOrigin ? 'text-brand-indigo/70' : 'text-text-muted'} group-hover:text-text-secondary transition-colors text-xs`}>
                                                {ev.from}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-3.5">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-medium transition-all duration-200
                                            ${ev.isOrigin
                                                ? 'text-brand-indigo bg-brand-indigo/10 border-brand-indigo/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]'
                                                : 'text-text-primary bg-surface-secondary border-surface-accent group-hover:border-text-muted/50'
                                            }`}>
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