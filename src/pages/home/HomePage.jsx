import { useState, useMemo } from 'react';
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

    const handleFetch = async (e) => {
        e.preventDefault();
        let sanitizedId = ticketId.trim().toUpperCase();
        if (!sanitizedId) return;
        if (/^\d+$/.test(sanitizedId)) sanitizedId = `TKT-${sanitizedId}`;

        setTicketId(sanitizedId);
        setStatus('loading');
        setErrorMsg('');
        setEvents([]);

        try {
            const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
            const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
            const res = await fetch(`${baseUrl}/api/timeline/${sanitizedId}`);
            const result = await res.json();

            if (!res.ok || !result.success) throw new Error(result.message || 'API Error');
            if (result.data.length === 0) throw new Error(`No telemetry found for ${sanitizedId}`);

            const sortedEvents = result.data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setEvents(sortedEvents);
            setStatus('success');
        } catch (err) {
            setErrorMsg(err.message);
            setStatus('error');
        }
    };

    const metrics = useMemo(() => {
        if (events.length === 0) return { hours: 0, mins: 0 };
        return calculateRWT(events);
    }, [events]);

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-10 flex flex-col gap-8">

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-6">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">RWT Engine</h1>
                    <p className="text-sm text-zinc-500 mt-1">DevRev SLA calculations.</p>
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
                    <div className="border border-red-900/50 text-red-400 p-4 rounded-md text-sm mb-6 bg-red-950/10">
                        Error: {errorMsg}
                    </div>
                )}

                {status === 'idle' && (
                    <div className="text-sm text-zinc-600 border border-dashed border-zinc-800 rounded-lg p-12 text-center bg-zinc-900/10 min-h-[400px] flex items-center justify-center">
                        Enter a ticket ID to begin analysis.
                    </div>
                )}

                {/* LOADING STATE: Zero Layout Shift */}
                {status === 'loading' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
                        {/* Left Column */}
                        <div className="lg:col-span-1 flex flex-col gap-6">
                            {/* Loader embedded EXACTLY where the Output card will be */}
                            <div className="h-[142px] border border-zinc-800/50 rounded-lg bg-zinc-900/20">
                                <DataLoader isLoading={true} />
                            </div>
                            <Skeleton className="h-[340px] w-full" />
                        </div>

                        {/* Right Column */}
                        <div className="lg:col-span-2">
                            <Skeleton className="h-[600px] w-full" />
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
                        <div className="lg:col-span-1">
                            <RwtRules metrics={metrics} ticketId={ticketId} />
                        </div>
                        <div className="lg:col-span-2 h-full">
                            <TelemetryTable events={events} />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}