import { useState, useMemo } from 'react';
import { Globe } from 'lucide-react';
import { SearchBar } from '../../features/search/SearchBar';
import { RwtRules } from '../../widgets/metrics/RwtRules';
import { TelemetryTable } from '../../widgets/telemetry/TelemetryTable';
import { DataLoader } from '../../shared/ui/DataLoader';
import { Skeleton } from '../../shared/ui/Skeleton';
import { calculateRWT } from '../../shared/lib/rwtEngine';

export function HomePage() {
    const [ticketId, setTicketId] = useState('');
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [events, setEvents] = useState([]);
    const [ticketMeta, setTicketMeta] = useState(null);
    const [ticketCreatedAt, setTicketCreatedAt] = useState(null);

    const handleFetch = async (e) => {
        e.preventDefault();
        let sanitizedId = ticketId.trim().toUpperCase();
        if (!sanitizedId) return;
        if (/^\d+$/.test(sanitizedId)) sanitizedId = `TKT-${sanitizedId}`;

        setTicketId(sanitizedId);
        setStatus('loading');
        setErrorMsg('');
        setEvents([]);
        setTicketMeta(null);
        setTicketCreatedAt(null);

        try {
            const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
            const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

            // 1. FETCH TICKET METADATA
            const metaPromise = fetch(`${baseUrl}/api/ticket/${sanitizedId}`)
                .then(res => res.json())
                .then(res => {
                    if (!res.success) throw new Error(res.message || 'Meta API Error');
                    return res.data;
                });

            // 2. FETCH TIMELINE LOGS
            let currentCursor = null;
            let hasNext = true;
            let accumulatedEvents = [];

            // ✅ FIX 1: Use a local variable to track creation date across pages
            let localCreatedAt = null;

            while (hasNext) {
                const cursorQuery = currentCursor ? `?cursor=${encodeURIComponent(currentCursor)}` : '';
                const res = await fetch(`${baseUrl}/api/timeline/${sanitizedId}${cursorQuery}`);
                const result = await res.json();

                if (!res.ok || !result.success) throw new Error(result.message || 'API Error');
                console.log("🔍 TIMELINE API PAYLOAD:", result);
                // ✅ FIX 1: Check EVERY page for the creation date until we find it
                if (!localCreatedAt) {
                    localCreatedAt = result.ticketCreatedAt || result.data?.ticketCreatedAt;
                }

                const newEvents = Array.isArray(result.data) ? result.data : result.data?.data || [];
                accumulatedEvents = [...accumulatedEvents, ...newEvents];

                currentCursor = result.next_cursor || result.data?.next_cursor;
                hasNext = !!currentCursor;
            }

            // Save the exact creation date to state
            if (localCreatedAt) {
                setTicketCreatedAt(localCreatedAt);
            }

            // 3. RESOLVE METADATA
            const metaData = await metaPromise;
            setTicketMeta(metaData);

            // 4. ATOMIC STATE UPDATE
            const sortedEvents = accumulatedEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setEvents(sortedEvents);
            setStatus('success');

        } catch (err) {
            setErrorMsg(err.message);
            setStatus('error');
        }
    };

    const metrics = useMemo(() => {
        if (events.length === 0 && !ticketCreatedAt) return { hours: 0, mins: 0 };
        return calculateRWT(events, ticketCreatedAt, ticketMeta?.slaRegion);
    }, [events, ticketCreatedAt, ticketMeta]);

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 flex flex-col gap-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">RWT Engine</h1>
                        {ticketMeta && (
                            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 uppercase">
                                <Globe className="w-3 h-3" />
                                {ticketMeta.slaRegion}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">
                        {ticketMeta ? ticketMeta.title : 'DevRev SLA calculations.'}
                    </p>
                </div>
                <SearchBar
                    ticketId={ticketId}
                    setTicketId={setTicketId}
                    onSearch={handleFetch}
                    isLoading={status === 'loading'}
                />
            </header>

            <main className="flex-grow w-full">
                {status === 'error' && (
                    <div className="border border-red-900/50 text-red-400 p-4 rounded-md text-sm mb-6 bg-red-950/20">
                        Error: {errorMsg}
                    </div>
                )}

                {status === 'idle' && (
                    <div className="text-sm text-zinc-600 border border-dashed border-zinc-800 rounded-lg p-16 flex flex-col items-center justify-center text-center bg-zinc-900/10 min-h-[400px]">
                        <p className="text-zinc-400 font-medium mb-2">Awaiting Telemetry Query</p>
                        <p>Enter a DevRev ticket ID above to calculate active business hours.</p>
                    </div>
                )}

                {status === 'loading' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
                        <div className="lg:col-span-1 flex flex-col gap-6">
                            <div className="h-[142px] border border-zinc-800/50 rounded-lg bg-zinc-900/20">
                                <DataLoader isLoading={true} />
                            </div>
                            <Skeleton className="h-[340px] w-full" />
                        </div>
                        <div className="lg:col-span-2">
                            <Skeleton className="h-[600px] w-full" />
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
                        <div className="lg:col-span-1 flex flex-col gap-6">
                            <RwtRules metrics={metrics} ticketId={ticketId} />
                        </div>
                        <div className="lg:col-span-2 h-full">
                            <TelemetryTable events={events} ticketCreatedAt={ticketCreatedAt} />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}