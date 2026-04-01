import React, { useState, useCallback } from 'react';
import { Copy, CheckCircle2, Clock } from 'lucide-react';

export function TelemetryTable({ events = [] }) {
    const [copied, setCopied] = useState(false);

    // 🧠 ENGINEER: The table is now "dumb". It trusts HomePage.jsx to provide 
    // the perfectly sorted array, including the injected 'isOrigin' row at index 0.

    const handleCopyTable = useCallback(() => {
        if (events.length === 0) return;

        let markdown = `| Seq | Local Timestamp | Transition Origin | Target State |\n`;
        markdown += `|---|---|---|---|\n`;

        events.forEach((ev, i) => {
            // Because HomePage puts the origin row at index 0, the math is simple:
            const seq = ev.isOrigin ? '00' : i.toString().padStart(2, '0');
            const time = new Date(ev.timestamp).toLocaleString(undefined, {
                weekday: 'short', month: 'short', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            markdown += `| ${seq} | ${time} | ${ev.from} | ${ev.to} |\n`;
        });

        navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [events]);

    // Empty State Handling
    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] border border-surface-accent/50 rounded-2xl bg-surface-secondary/20 backdrop-blur-md ring-1 ring-white/5">
                <div className="relative mb-4">
                    <div className="absolute inset-0 bg-brand-cyan/20 blur-xl rounded-full animate-pulse" />
                    <Clock className="w-10 h-10 text-brand-cyan/60 relative z-10 drop-shadow-sm" />
                </div>
                <p className="text-sm font-bold text-text-primary drop-shadow-sm">Awaiting Telemetry</p>
                <p className="text-xs text-text-muted mt-1 font-medium">No transition events recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-h-[850px] border border-surface-accent/40 rounded-2xl overflow-hidden bg-surface-primary/40 backdrop-blur-xl shadow-2xl ring-1 ring-white/5 relative z-10">

            {/* 🎩 DESIGNER: The Header acts as the control surface. */}
            <header className="px-6 py-5 border-b border-surface-accent/50 bg-surface-secondary/30 flex justify-between items-center z-20">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold tracking-wide text-text-primary uppercase drop-shadow-sm">Event Ledger</h3>
                    <span className="flex items-center justify-center px-2 py-0.5 rounded-md bg-surface-accent/50 text-text-secondary text-[10px] font-mono border border-surface-accent/50 ring-1 ring-white/5 shadow-inner">
                        {events.length} RECORDS
                    </span>
                </div>

                <button
                    onClick={handleCopyTable}
                    disabled={events.length === 0}
                    className="group relative flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                             bg-surface-secondary/40 border-surface-accent/60 hover:bg-surface-secondary/80 hover:border-text-muted/50 text-text-secondary hover:text-white shadow-sm ring-1 ring-white/5"
                    aria-label="Export to Markdown"
                >
                    {copied ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald animate-in zoom-in duration-200 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    ) : (
                        <Copy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                    )}
                    <span className={`transition-colors ${copied ? "text-brand-emerald" : ""}`}>
                        {copied ? 'Markdown Copied' : 'Export .MD'}
                    </span>
                </button>
            </header>

            {/* 💻 ENGINEER: The scroll container. */}
            <div className="overflow-y-auto overflow-x-auto flex-1 overscroll-contain pb-6 scroll-smooth">
                <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                    <thead className="sticky top-0 bg-surface-primary/80 backdrop-blur-md text-text-muted text-[10px] uppercase tracking-widest border-b border-surface-accent/60 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-4 font-semibold w-16">Seq</th>
                            <th className="px-6 py-4 font-semibold">Local Timestamp</th>
                            <th className="px-6 py-4 font-semibold">Origin State</th>
                            <th className="px-6 py-4 font-semibold">Target State</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-accent/20">
                        {events.map((ev, i) => {
                            // If it's the injected origin row, label it '00'. Otherwise, pad the index.
                            const seq = ev.isOrigin ? '00' : i.toString().padStart(2, '0');

                            // Native staggered entrance animation logic
                            const staggerDelay = `${i * 0.02}s`;

                            return (
                                <tr
                                    key={`${ev.timestamp}-${i}`}
                                    className={`group transition-all duration-300 animate-fade-in
                                        ${ev.isOrigin
                                            ? 'bg-brand-indigo/5 hover:bg-brand-indigo/15'
                                            : 'hover:bg-white/[0.03]'
                                        }`}
                                    style={{ animationFillMode: 'both', animationDelay: staggerDelay }}
                                >
                                    <td className="px-6 py-3.5 text-text-muted/70 font-mono text-xs border-r border-surface-accent/20 tabular-nums">
                                        {seq}
                                    </td>

                                    <td className={`px-6 py-3.5 font-mono text-xs tabular-nums tracking-tight transition-colors duration-300
                                        ${ev.isOrigin ? 'text-brand-indigo drop-shadow-[0_0_8px_rgba(129,140,248,0.3)]' : 'text-text-secondary group-hover:text-text-primary'}`}>
                                        {new Date(ev.timestamp).toLocaleString(undefined, {
                                            month: 'short', day: '2-digit',
                                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                                        })}
                                    </td>

                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] 
                                                ${ev.isOrigin ? 'bg-brand-indigo text-brand-indigo' : 'bg-surface-accent text-transparent group-hover:bg-text-muted group-hover:text-text-muted'}`}
                                            />
                                            <span className={`text-xs font-medium transition-colors duration-300
                                                ${ev.isOrigin ? 'text-brand-indigo/80' : 'text-text-muted group-hover:text-text-secondary'}`}>
                                                {ev.from}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-3.5">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-bold transition-all duration-300 tracking-wide
                                            ${ev.isOrigin
                                                ? 'text-brand-indigo bg-brand-indigo/10 border-brand-indigo/30 shadow-[0_0_15px_rgba(129,140,248,0.2)]'
                                                : 'text-text-primary bg-surface-secondary/40 border-surface-accent/50 group-hover:border-surface-accent group-hover:bg-surface-secondary/80 ring-1 ring-white/0 group-hover:ring-white/5'
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