import React, { useState, useMemo, useCallback } from 'react';
import { Globe, AlertCircle, Inbox, Loader2, ServerCrash } from 'lucide-react';

// --- FSD: FEATURES ---
import { SearchBar } from '../../features/search/SearchBar';

// --- FSD: WIDGETS ---
import { RwtRules } from '../../widgets/metrics/RwtRules';
import { TelemetryTable } from '../../widgets/telemetry/TelemetryTable';

// --- FSD: SHARED ---
import { DataLoader } from '../../shared/ui/DataLoader';
import { Skeleton } from '../../shared/ui/Skeleton';

// --- ENGINES ---
import { calculateRWT } from '../../shared/lib/rwtEngine';
import { calculateFRT, calculateFRR } from '../../shared/lib/frtEngine';

export function HomePage() {
    const [ticketId, setTicketId] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [errorMsg, setErrorMsg] = useState('');

    // Throttle State (429 Rate Limit)
    const [isThrottled, setIsThrottled] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // Warning State (504 Timeout)
    const [hasPartialData, setHasPartialData] = useState(false);

    // Domain State
    const [events, setEvents] = useState([]);
    const [ticketMeta, setTicketMeta] = useState(null);
    const [ticketCreatedAt, setTicketCreatedAt] = useState(null);
    const [firstResponseAt, setFirstResponseAt] = useState(null);
    const [customerReplies, setCustomerReplies] = useState([]);

    // ⏱️ Rate Limit Manager
    const triggerCooldown = useCallback(() => {
        setIsThrottled(true);
        setCooldown(30);
        const timer = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsThrottled(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const handleFetch = useCallback(async (e) => {
        if (e) e.preventDefault();

        if (status === 'loading' || isThrottled) return;

        let sanitizedId = ticketId.trim().toUpperCase();
        if (!sanitizedId) return;
        if (/^\d+$/.test(sanitizedId)) sanitizedId = `TKT-${sanitizedId}`;

        setTicketId(sanitizedId);
        setStatus('loading');
        setErrorMsg('');
        setHasPartialData(false);

        setEvents([]);
        setTicketMeta(null);
        setTicketCreatedAt(null);
        setFirstResponseAt(null);
        setCustomerReplies([]);

        try {
            const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
            const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

            // 1. START METADATA FETCH (with Backend Error Matrix)
            const metaRes = await fetch(`${baseUrl}/api/ticket/${sanitizedId}`);

            if (!metaRes.ok) {
                if (metaRes.status === 400) throw new Error("Invalid DevRev ID.");
                if (metaRes.status === 404) throw new Error("API Route not found. Check VITE_API_BASE_URL in .env.");
                if (metaRes.status === 429) {
                    triggerCooldown();
                    throw new Error("Rate limit exceeded. Waiting for cooldown.");
                }
                if (metaRes.status === 502) throw new Error("DevRev Telemetry unavailable.");
                throw new Error(`Meta API Error: ${metaRes.status}`);
            }

            const metaJson = await metaRes.json();
            if (!metaJson.success) throw new Error(metaJson.message || 'Meta API Error');
            const metaData = metaJson.data;

            // 2. TIMELINE PAGINATION ENGINE
            let currentCursor = null;
            let hasNext = true;
            let accumulatedEvents = [];
            let localCreatedAt = null;
            let localFirstResponseAt = null;
            let localCustomerReplies = [];

            const seenCursors = new Set();
            let pageCount = 0;
            const MAX_PAGES = 30;

            while (hasNext && pageCount < MAX_PAGES) {
                pageCount++;

                if (currentCursor) {
                    if (seenCursors.has(currentCursor)) break;
                    seenCursors.add(currentCursor);
                }

                const cursorQuery = currentCursor ? `?cursor=${encodeURIComponent(currentCursor)}` : '';
                const timelineRes = await fetch(`${baseUrl}/api/timeline/${sanitizedId}${cursorQuery}`);

                // --- BACKEND ERROR MATRIX IMPLEMENTATION ---
                if (!timelineRes.ok) {
                    if (timelineRes.status === 429) {
                        triggerCooldown();
                        setHasPartialData(true);
                        break; // Stop loop, keep what we have
                    }
                    if (timelineRes.status === 502) throw new Error("DevRev Telemetry unavailable.");
                    if (timelineRes.status === 504) {
                        console.warn("[504 TIMEOUT] DevRev took >8s. Stopping recursive loop. Showing partial data.");
                        setHasPartialData(true);
                        break; // Graceful degradation
                    }
                    throw new Error(`Gateway Error: ${timelineRes.status}`);
                }

                const result = await timelineRes.json();
                if (!result.success) throw new Error(result.message || 'API Error');

                const payload = result.data || result;
                if (!localCreatedAt) localCreatedAt = payload.ticketCreatedAt;
                if (!localFirstResponseAt) localFirstResponseAt = payload.firstResponseAt;

                const newReplies = payload.customerReplyTimestamps || [];
                localCustomerReplies = [...localCustomerReplies, ...newReplies];

                const newEvents = Array.isArray(result.data) ? result.data : (result.data?.data || []);
                accumulatedEvents = [...accumulatedEvents, ...newEvents];

                currentCursor = result.next_cursor || result.nextCursor || result.data?.next_cursor;
                hasNext = !!currentCursor;
            }

            if (localCreatedAt) setTicketCreatedAt(localCreatedAt);
            if (localFirstResponseAt) setFirstResponseAt(localFirstResponseAt);
            setCustomerReplies(localCustomerReplies);
            setTicketMeta(metaData);

            const sortedEvents = accumulatedEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setEvents(sortedEvents);
            setStatus('success');

        } catch (err) {
            console.error("SLA Engine Failure:", err);
            setErrorMsg(err.message);
            setStatus('error');
        }
    }, [ticketId, status, isThrottled, triggerCooldown]);

    // --- MEMOIZED METRICS ---
    const rwtMetrics = useMemo(() => {
        if (events.length === 0 && !ticketCreatedAt) return { hours: 0, mins: 0 };
        return calculateRWT(events, ticketCreatedAt || '', ticketMeta?.slaRegion || 'Default');
    }, [events, ticketCreatedAt, ticketMeta]);

    const frtMetrics = useMemo(() => {
        return calculateFRT(ticketCreatedAt || '', firstResponseAt || '');
    }, [ticketCreatedAt, firstResponseAt]);

    const frrStatus = useMemo(() => {
        if (!events.length) return 'PENDING';
        return calculateFRR(events, firstResponseAt || '', customerReplies);
    }, [events, firstResponseAt, customerReplies]);

    return (
        <div className="min-h-screen bg-surface-primary text-text-primary selection:bg-brand-indigo/30">
            <div className="max-w-7xl mx-auto p-6 md:p-10 flex flex-col gap-8">

                {/* HEADER / NAVIGATION */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-surface-accent pb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-white">
                                Telemetry <span className="text-text-muted font-light">OS</span>
                            </h1>
                            {ticketMeta && !hasPartialData && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo text-[10px] font-bold uppercase tracking-widest animate-fade-in">
                                    <Globe className="w-3 h-3" />
                                    {ticketMeta.slaRegion}
                                </div>
                            )}
                            {hasPartialData && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-widest animate-fade-in">
                                    <AlertCircle className="w-3 h-3" />
                                    PARTIAL DATA (504)
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-text-secondary max-w-md leading-relaxed">
                            {ticketMeta ? ticketMeta.title : 'High-fidelity service level agreement monitoring and event telemetry.'}
                        </p>
                    </div>

                    <div className="relative">
                        <SearchBar
                            ticketId={ticketId}
                            setTicketId={setTicketId}
                            onSearch={handleFetch}
                            isLoading={status === 'loading'}
                            disabled={isThrottled}
                        />
                    </div>
                </header>

                {/* MAIN CONTENT AREA */}
                <main className="relative min-h-[500px]">

                    {/* THROTTLE / RATE LIMIT BANNER (429) */}
                    {isThrottled && (
                        <div className="mb-8 flex items-center justify-between bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl animate-fade-in">
                            <div className="flex items-center gap-3 text-amber-500">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <div>
                                    <p className="text-sm font-semibold tracking-tight">API Rate Limit Exceeded</p>
                                    <p className="text-xs text-amber-500/80">DevRev upstream is throttling requests. Please wait.</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="font-mono text-xl font-bold text-amber-500 leading-none">
                                    00:{cooldown.toString().padStart(2, '0')}
                                </span>
                                <span className="text-[10px] uppercase tracking-widest text-amber-500/70 font-bold mt-1">Cooldown</span>
                            </div>
                        </div>
                    )}

                    {/* CRITICAL ERROR STATE (400, 404, 502) */}
                    {status === 'error' && !isThrottled && (
                        <div className="flex items-center gap-4 border border-brand-rose/30 bg-brand-rose/5 p-5 rounded-2xl animate-fade-in">
                            <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center flex-shrink-0">
                                <ServerCrash className="w-5 h-5 text-brand-rose" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-brand-rose tracking-tight">Telemetry Interruption</h3>
                                <p className="text-sm text-brand-rose/80 mt-0.5">{errorMsg}</p>
                            </div>
                        </div>
                    )}

                    {/* IDLE STATE */}
                    {status === 'idle' && (
                        <div className="flex flex-col items-center justify-center py-32 border border-dashed border-surface-accent rounded-2xl bg-surface-secondary/20">
                            <div className="w-12 h-12 rounded-full bg-surface-accent flex items-center justify-center mb-4 text-text-muted">
                                <Inbox className="w-6 h-6" />
                            </div>
                            <h3 className="text-text-primary font-medium">No Active Query</h3>
                            <p className="text-text-secondary text-sm mt-1">Enter a DevRev Ticket ID to begin analysis.</p>
                        </div>
                    )}

                    {/* LOADING STATE */}
                    {status === 'loading' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full will-change-transform">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="h-40 rounded-2xl border border-surface-accent bg-surface-secondary/40 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
                                </div>
                                <Skeleton className="h-80 w-full rounded-2xl" />
                            </div>
                            <div className="lg:col-span-2">
                                <Skeleton className="h-[600px] w-full rounded-2xl" />
                            </div>
                        </div>
                    )}

                    {/* SUCCESS STATE */}
                    {status === 'success' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
                            <aside className="lg:col-span-1 sticky top-10 space-y-6">
                                <RwtRules
                                    rwtMetrics={rwtMetrics}
                                    frtMetrics={frtMetrics}
                                    frrStatus={frrStatus}
                                    ticketId={ticketId}
                                />
                                <div className="p-4 rounded-xl bg-surface-secondary/50 border border-surface-accent">
                                    <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">System Health</h4>
                                    <div className="flex items-center justify-between text-xs border-b border-surface-accent/50 pb-2 mb-2">
                                        <span className="text-text-secondary">Data Integrity</span>
                                        {hasPartialData ? (
                                            <span className="text-amber-500 font-medium">Partial Sync</span>
                                        ) : (
                                            <span className="text-brand-emerald font-medium">Full Sync</span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-text-secondary">Events Processed</span>
                                        <span className="text-text-primary font-mono">{events.length}</span>
                                    </div>
                                </div>
                            </aside>

                            <section className="lg:col-span-2 rounded-2xl border border-surface-accent bg-surface-secondary/30 overflow-hidden shadow-2xl">
                                <TelemetryTable
                                    events={events}
                                    ticketCreatedAt={ticketCreatedAt}
                                />
                            </section>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}