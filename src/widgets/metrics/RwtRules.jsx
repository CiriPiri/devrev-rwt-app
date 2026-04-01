import React, { useState, useCallback } from 'react';
import { Copy, CheckCircle2, Clock, Zap, Target, ChevronDown } from 'lucide-react';

export function RwtRules({
    rwtMetrics = { hours: 0, mins: 0 },
    frtMetrics = null,
    frrStatus = "PENDING",
    ticketId = 'TKT-XXX'
}) {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState('rwt'); // Default to first item open

    const toggleRule = useCallback((id) => {
        setExpanded((prev) => (prev === id ? null : id));
    }, []);

    const handleCopyMetrics = useCallback(() => {
        const rwtH = rwtMetrics?.hours || 0;
        const rwtM = rwtMetrics?.mins || 0;
        const frtH = frtMetrics?.hours || 0;
        const frtM = frtMetrics?.mins || 0;

        const text = `[${ticketId}] SLA Report\n• RWT: ${rwtH}h ${rwtM}m\n• FRT: ${frtH}h ${frtM}m\n• FRR: ${frrStatus}`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [rwtMetrics, frtMetrics, frrStatus, ticketId]);

    return (
        <div className="flex flex-col gap-5 w-full">
            {/* Header Area */}
            <div className="flex justify-between items-center px-1 border-b border-surface-accent/50 pb-2">
                <div className="flex items-center gap-2.5">
                    <div className="relative flex items-center justify-center w-2 h-2">
                        <div className="absolute w-full h-full rounded-full bg-brand-indigo animate-ping opacity-50" />
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-indigo" />
                    </div>
                    <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Metric Insights</h3>
                </div>

                <button
                    onClick={handleCopyMetrics}
                    className="group flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/50 rounded-md px-2 py-1 -mr-2"
                    aria-label="Copy metrics summary to clipboard"
                >
                    {copied ? (
                        <CheckCircle2 className="w-3 h-3 text-brand-emerald animate-in zoom-in duration-200" />
                    ) : (
                        <Copy className="w-3 h-3 text-text-muted group-hover:text-text-primary transition-colors" />
                    )}
                    <span className={copied ? "text-brand-emerald" : "text-text-muted group-hover:text-text-primary"}>
                        {copied ? 'Copied' : 'Copy'}
                    </span>
                </button>
            </div>

            {/* Accordion List */}
            <div className="flex flex-col gap-3">
                <MetricCard
                    id="rwt"
                    title="Resolution Working Time"
                    icon={<Clock className="w-3.5 h-3.5" />}
                    accent="indigo"
                    isExpanded={expanded === 'rwt'}
                    onToggle={() => toggleRule('rwt')}
                    formula="RWT = Σ(Work States) - (Paused States + After Hours)"
                    rules={[
                        "Counts time in 'Open', 'In Progress', or 'Waiting on Assignee'.",
                        "Terminal States: 'Solved' and 'Resolved' both halt the clock.",
                        "Excludes weekends and non-business hours (e.g., 09:00-18:00 IST).",
                        "Paused states like 'Pending' or 'Deferred' are strictly subtracted."
                    ]}
                >
                    <div className="flex items-baseline gap-0.5 tabular-nums">
                        <span className="text-3xl font-bold text-text-primary tracking-tight">{rwtMetrics?.hours || 0}</span>
                        <span className="text-xs font-bold text-text-muted mr-2">h</span>
                        <span className="text-3xl font-bold text-text-primary tracking-tight">{rwtMetrics?.mins || 0}</span>
                        <span className="text-xs font-bold text-text-muted">m</span>
                    </div>
                </MetricCard>

                <MetricCard
                    id="frt"
                    title="First Response Time"
                    icon={<Zap className="w-3.5 h-3.5" />}
                    accent="emerald"
                    isExpanded={expanded === 'frt'}
                    onToggle={() => toggleRule('frt')}
                    formula="FRT = First Human Agent Reply - Creation Timestamp"
                    rules={[
                        "Ignores automated system comments and 'Email Integration Bot'.",
                        "Chronological Audit: Uses earliest timestamp of a 'dev_user' comment.",
                        "The 60-Second Bypass ensures auto-forwards aren't counted as 0m replies."
                    ]}
                >
                    {frtMetrics ? (
                        <div className="flex items-baseline gap-0.5 tabular-nums">
                            <span className="text-3xl font-bold text-text-primary tracking-tight">{frtMetrics.hours || 0}</span>
                            <span className="text-xs font-bold text-text-muted mr-2">h</span>
                            <span className="text-3xl font-bold text-text-primary tracking-tight">{frtMetrics.mins || 0}</span>
                            <span className="text-xs font-bold text-text-muted">m</span>
                        </div>
                    ) : (
                        <span className="text-2xl font-bold text-text-muted/50 tracking-tight italic">Pending</span>
                    )}
                </MetricCard>

                <MetricCard
                    id="frr"
                    title="First Response Resolution"
                    icon={<Target className="w-3.5 h-3.5" />}
                    accent={frrStatus === 'YES' ? 'blue' : frrStatus === 'NO' ? 'rose' : 'zinc'}
                    isExpanded={expanded === 'frr'}
                    onToggle={() => toggleRule('frr')}
                    formula="FRR = (Final: Solved) AND (Total Agent Replies === 1)"
                    rules={[
                        "A 'YES' requires the ticket to reach 'Solved' or 'Resolved'.",
                        "Agent Effort Rule: The agent must have only replied exactly 1 time.",
                        "Customer follow-ups (like 'Thank you') no longer break the metric.",
                        "If the agent has to reply 2+ times, FRR is marked as 'NO'."
                    ]}
                >
                    <span className={`text-3xl font-black tracking-tighter uppercase tabular-nums
                        ${frrStatus === 'YES' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]' :
                            frrStatus === 'NO' ? 'text-brand-rose drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]' :
                                'text-text-muted'}`}>
                        {frrStatus}
                    </span>
                </MetricCard>
            </div>
        </div>
    );
}

function MetricCard({ id, title, icon, accent, children, isExpanded, onToggle, formula, rules }) {
    // Designer Tokens mapping
    const accentMap = {
        indigo: "text-brand-indigo bg-brand-indigo/10 border-brand-indigo/20 ring-brand-indigo/20",
        emerald: "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20 ring-brand-emerald/20",
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20 ring-blue-500/20",
        rose: "text-brand-rose bg-brand-rose/10 border-brand-rose/20 ring-brand-rose/20",
        zinc: "text-text-muted bg-surface-accent border-surface-accent/80 ring-surface-accent/20"
    };

    const isPending = accent === 'zinc';

    return (
        <div className={`group relative flex flex-col border rounded-xl overflow-hidden transition-all duration-300
            ${isExpanded ? 'bg-surface-secondary/80 border-surface-accent shadow-lg' : 'bg-surface-secondary/40 border-surface-accent/50 hover:bg-surface-secondary hover:border-surface-accent'}
            ${isExpanded && !isPending ? 'shadow-[0_4px_24px_-8px_var(--tw-shadow-color)]' : ''}
            `}
            style={{
                '--tw-shadow-color':
                    accent === 'indigo' ? 'rgba(99,102,241,0.15)' :
                        accent === 'emerald' ? 'rgba(16,185,129,0.15)' :
                            accent === 'blue' ? 'rgba(96,165,250,0.15)' :
                                accent === 'rose' ? 'rgba(244,63,94,0.15)' : 'transparent'
            }}
        >
            {/* Interactive Header */}
            <button
                onClick={onToggle}
                aria-expanded={isExpanded}
                aria-controls={`sect-${id}`}
                className="w-full text-left p-4 flex items-start justify-between focus:outline-none focus-visible:bg-surface-secondary/80"
            >
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg flex items-center justify-center border transition-colors ${accentMap[accent]}`}>
                            {icon}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isExpanded ? 'text-text-primary' : 'text-text-secondary'}`}>
                            {title}
                        </span>
                    </div>
                    <div className="pl-1 pt-1">
                        {children}
                    </div>
                </div>

                <div className={`mt-2 p-1.5 rounded-full transition-all duration-300 
                    ${isExpanded ? 'bg-surface-accent text-text-primary rotate-180' : 'bg-transparent text-text-muted group-hover:bg-surface-accent/50 group-hover:text-text-secondary'}`}
                >
                    <ChevronDown className="w-3.5 h-3.5" />
                </div>
            </button>

            {/* Engineer: Pure CSS Grid Height Animation */}
            <div
                id={`sect-${id}`}
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}
                `}
            >
                <div className="overflow-hidden">
                    <div className="px-5 pb-5 pt-1">
                        <div className="h-px w-full bg-gradient-to-r from-surface-accent/10 via-surface-accent to-surface-accent/10 mb-4" />

                        <div className="mb-4">
                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.15em] block mb-1.5">Formula</span>
                            <code className="text-[10px] font-mono text-brand-indigo leading-relaxed bg-brand-indigo/5 border border-brand-indigo/10 px-2.5 py-1.5 rounded block shadow-inner">
                                {formula}
                            </code>
                        </div>

                        <div>
                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.15em] block mb-2">Calculation Rules</span>
                            <ul className="space-y-2">
                                {rules.map((rule, i) => (
                                    <li key={i} className="text-[10px] text-text-secondary flex items-start gap-2.5 leading-relaxed">
                                        <div className="w-1 h-1 rounded-full bg-surface-accent mt-[6px] flex-shrink-0" />
                                        <span>{rule}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}