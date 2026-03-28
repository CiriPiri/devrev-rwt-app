export function RwtRules({ metrics }) {
    return (
        <div className="flex flex-col gap-6">
            {/* Output Block */}
            <div className="border border-zinc-800 rounded-lg p-5">
                <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-semibold">Resolution Working Time</h2>
                <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-medium tracking-tight text-zinc-100">{metrics.hours}</span>
                    <span className="text-zinc-500 font-mono text-sm mr-3">hrs</span>
                    <span className="text-5xl font-medium tracking-tight text-zinc-100">{metrics.mins}</span>
                    <span className="text-zinc-500 font-mono text-sm">mins</span>
                </div>
            </div>

            {/* Rules Block (Text Heavy & Dense) */}
            <div className="border border-zinc-800 rounded-lg p-5 bg-zinc-900/20">
                <h3 className="text-sm font-medium text-zinc-200 mb-4">Calculation Formula</h3>
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
                        <strong className="text-zinc-200 block mb-0.5 font-medium">3. Business Hours</strong>
                        Time accumulates only between <span className="text-zinc-300 font-mono">09:00</span> and <span className="text-zinc-300 font-mono">17:00</span> local system time. Hours outside this window evaluate to 0.
                    </li>
                    <li>
                        <strong className="text-zinc-200 block mb-0.5 font-medium">4. Weekend Exclusion</strong>
                        Saturdays and Sundays are bypassed. Friday 17:00 flows directly into Monday 09:00.
                    </li>
                </ul>
            </div>
        </div>
    );
}