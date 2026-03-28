import { useState } from 'react';

export function RwtRules({ metrics, ticketId }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const text = `RWT for ${ticketId}: ${metrics.hours}h ${metrics.mins}m`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-6">

            {/* Output Block */}
            <div className="border border-zinc-800 rounded-lg p-5 group relative">
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Resolution Working Time</h2>
                    <button
                        onClick={handleCopy}
                        className="text-xs font-medium text-zinc-400 hover:text-zinc-100 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 px-2 py-1 rounded transition-colors"
                    >
                        {copied ? 'Copied ✓' : 'Copy'}
                    </button>
                </div>

                <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-medium tracking-tight text-zinc-100">{metrics.hours}</span>
                    <span className="text-zinc-500 font-mono text-sm mr-3">hrs</span>
                    <span className="text-5xl font-medium tracking-tight text-zinc-100">{metrics.mins}</span>
                    <span className="text-zinc-500 font-mono text-sm">mins</span>
                </div>
            </div>

            {/* Rules Block (Updated for Dynamic Regional SLAs) */}
            <div className="border border-zinc-800 rounded-lg p-5 bg-zinc-900/20">
                <h3 className="text-sm font-medium text-zinc-200 mb-4">Calculation Engine Rules</h3>
                <ul className="text-sm text-zinc-400 space-y-4">
                    <li>
                        <strong className="text-zinc-200 block mb-0.5 font-medium">1. Active States</strong>
                        Time accumulates strictly on <code className="text-zinc-300 font-mono text-xs">Queued</code> or <code className="text-zinc-300 font-mono text-xs">Waiting on Assignee</code>.
                    </li>
                    <li>
                        <strong className="text-zinc-200 block mb-0.5 font-medium">2. Paused States</strong>
                        The timer stops immediately upon transition to <code className="text-zinc-300 font-mono text-xs">Awaiting Customer Reply</code>.
                    </li>
                    <li>
                        <strong className="text-zinc-200 block mb-0.5 font-medium">3. Dynamic Business Hours</strong>
                        Time accumulation is bound by the specific <span className="text-zinc-300">SLA Region</span> assigned to the ticket. All global schedules are strictly evaluated against <span className="text-zinc-300 font-mono">IST (GMT+05:30)</span>.
                    </li>
                    <li>
                        <strong className="text-zinc-200 block mb-0.5 font-medium">4. Weekend Exclusion</strong>
                        Saturdays and Sundays are bypassed entirely. Friday's regional closing time flows directly into Monday's opening time.
                    </li>
                </ul>
            </div>

            {/* User Instruction Banner */}
            <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900 text-xs text-zinc-400 leading-relaxed">
                <strong>Note on Vercel Edge Cache:</strong> Initial ticket queries may take a few seconds as the engine parses paginated history. Subsequent queries are served instantly via the Edge Network.
            </div>
        </div>
    );
}