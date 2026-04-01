import React, { useState, useCallback } from 'react';
import { Copy, CheckCircle2, Clock, Zap, Target, ChevronDown } from 'lucide-react';

export function RwtRules({
    rwtMetrics = { hours: 0, mins: 0 },
    frtMetrics = null,
    frrStatus = "PENDING",
    ticketId = 'TKT-XXX'
}) {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState('rwt');

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
        <div className="flex flex-col gap-5 w-full relative z-10">
            {/* Header Area */}
            <div className="flex justify-between items-center px-1 border-b border-surface-accent/40 pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="relative flex items-center justify-center w-2 h-2">
                        <div className="absolute w-full h-full rounded-full bg-brand-cyan animate-ping opacity-60" />
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                    </div>
                    <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] drop-shadow-sm">Metric Insights</h3>
                </div>

                <button
                    onClick={handleCopyMetrics}
                    className="group flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/50 rounded-md px-2 py-1 -mr-2 hover:bg-surface-secondary/30"
                    aria-label="Copy metrics summary to clipboard"
                >
                    {copied ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald animate-in zoom-in duration-200" />
                    ) : (
                        <Copy className="w-3.5 h-3.5 text-text-muted group-hover:text-text-primary transition-colors" />
                    )}
                    <span className={copied ? "text-brand-emerald" : "text-text-muted group-hover:text-text-primary transition-colors"}>
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
                        <span className="text-3xl font-bold text-text-primary tracking-tight drop-shadow-sm">{rwtMetrics?.hours || 0}</span>
                        <span className="text-xs font-bold text-text-muted mr-2">h</span>
                        <span className="text-3xl font-bold text-text-primary tracking-tight drop-shadow-sm">{rwtMetrics?.mins || 0}</span>
                        <span className="text-xs font-bold text-text-muted">m</span>
                    </div>
                </MetricCard>

                <MetricCard
                    id="frt"
                    title="First Response Time"
                    icon={<Zap className="w-3.5 h-3.5" />}
                    accent="cyan"
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
                            <span className="text-3xl font-bold text-text-primary tracking-tight drop-shadow-sm">{frtMetrics.hours || 0}</span>
                            <span className="text-xs font-bold text-text-muted mr-2">h</span>
                            <span className="text-3xl font-bold text-text-primary tracking-tight drop-shadow-sm">{frtMetrics.mins || 0}</span>
                            <span className="text-xs font-bold text-text-muted">m</span>
                        </div>
                    ) : (
                        <span className="text-2xl font-bold text-text-muted/40 tracking-tight italic">Pending</span>
                    )}
                </MetricCard>

                <MetricCard
                    id="frr"
                    title="First Response Resolution"
                    icon={<Target className="w-3.5 h-3.5" />}
                    accent={frrStatus === 'YES' ? 'purple' : frrStatus === 'NO' ? 'rose' : 'zinc'}
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
                        ${frrStatus === 'YES' ? 'text-brand-purple drop-shadow-[0_0_12px_rgba(192,132,252,0.4)]' :
                            frrStatus === 'NO' ? 'text-brand-rose drop-shadow-[0_0_12px_rgba(251,113,133,0.4)]' :
                                'text-text-muted/60'}`}>
                        {frrStatus}
                    </span>
                </MetricCard>
            </div>
        </div>
    );
}

function MetricCard({ id, title, icon, accent, children, isExpanded, onToggle, formula, rules }) {
    // Designer Tokens mapping updated for Aurora Vibe
    const accentMap = {
        indigo: "text-brand-indigo bg-brand-indigo/10 border-brand-indigo/20 shadow-[0_0_15px_rgba(129,140,248,0.15)]",
        cyan: "text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20 shadow-[0_0_15px_rgba(34,211,238,0.15)]",
        emerald: "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20 shadow-[0_0_15px_rgba(52,211,153,0.15)]",
        purple: "text-brand-purple bg-brand-purple/10 border-brand-purple/20 shadow-[0_0_15px_rgba(192,132,252,0.15)]",
        rose: "text-brand-rose bg-brand-rose/10 border-brand-rose/20 shadow-[0_0_15px_rgba(251,113,133,0.15)]",
        zinc: "text-text-muted bg-surface-accent/30 border-surface-accent/50"
    };

    const isPending = accent === 'zinc';

    return (
        <div className={`group relative flex flex-col border rounded-xl overflow-hidden transition-all duration-300 backdrop-blur-md ring-1 ring-white/5
            ${isExpanded
                ? 'bg-surface-secondary/50 border-surface-accent/80 shadow-2xl'
                : 'bg-surface-secondary/20 border-surface-accent/30 hover:bg-surface-secondary/40 hover:border-surface-accent/60'}
            `}
        >
            {/* Interactive Header */}
            <button
                onClick={onToggle}
                aria-expanded={isExpanded}
                aria-controls={`sect-${id}`}
                className="w-full text-left p-4 flex items-start justify-between focus:outline-none focus-visible:bg-surface-secondary/60"
            >
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg flex items-center justify-center border transition-all duration-300 ${accentMap[accent]}`}>
                            {icon}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isExpanded ? 'text-text-primary' : 'text-text-secondary'}`}>
                            {title}
                        </span>
                    </div>
                    <div className="pl-1 pt-1.5">
                        {children}
                    </div>
                </div>

                <div className={`mt-2 p-1.5 rounded-full transition-all duration-300 border
                    ${isExpanded
                        ? 'bg-surface-accent/50 border-surface-accent text-text-primary rotate-180'
                        : 'bg-surface-accent/10 border-transparent text-text-muted group-hover:bg-surface-accent/30 group-hover:border-surface-accent/50 group-hover:text-text-secondary'}`}
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
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-surface-accent/80 to-transparent mb-5" />

                        <div className="mb-5">
                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.15em] block mb-2">Formula</span>
                            <code className="text-[10px] font-mono text-text-primary leading-relaxed bg-surface-primary/50 border border-surface-accent/50 px-2.5 py-2 rounded-lg block shadow-inner ring-1 ring-black/20">
                                <span className={
                                    accent === 'indigo' ? 'text-brand-indigo' :
                                        accent === 'cyan' ? 'text-brand-cyan' :
                                            accent === 'purple' ? 'text-brand-purple' : 'text-text-secondary'
                                }>
                                    {formula.split('=')[0]}
                                </span>
                                = {formula.split('=')[1]}
                            </code>
                        </div>

                        <div>
                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.15em] block mb-2">Calculation Rules</span>
                            <ul className="space-y-2.5">
                                {rules.map((rule, i) => (
                                    <li key={i} className="text-[10px] text-text-secondary flex items-start gap-3 leading-relaxed">
                                        <div className={`w-1 h-1 rounded-full mt-[7px] flex-shrink-0 shadow-[0_0_8px_currentColor]
                                            ${accent === 'indigo' ? 'bg-brand-indigo text-brand-indigo' :
                                                accent === 'cyan' ? 'bg-brand-cyan text-brand-cyan' :
                                                    accent === 'purple' ? 'bg-brand-purple text-brand-purple' : 'bg-surface-accent text-transparent'}`}
                                        />
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