import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, AlertTriangle, Info, Copy, CheckCircle2 } from 'lucide-react';
import { calculateRWT } from './utils/rwt';

export default function App() {
  const [ticketId, setTicketId] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [events, setEvents] = useState([]);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleFetch = async (e) => {
    e.preventDefault();
    let sanitizedId = ticketId.trim().toUpperCase();
    if (!sanitizedId) return;
    if (/^\d+$/.test(sanitizedId)) sanitizedId = `TKT-${sanitizedId}`;

    setTicketId(sanitizedId);
    setStatus('loading');
    setErrorMsg('');
    setCopied(false);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${baseUrl}/api/timeline/${sanitizedId}`);
      const result = await res.json();

      if (!res.ok || !result.success) throw new Error(result.message || 'API Error');
      if (result.data.length === 0) throw new Error(`No stage data found for ${sanitizedId}`);

      const sortedEvents = result.data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      setEvents(sortedEvents);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  // ENGINEER'S TOUCH: useMemo ensures this heavy calculation only runs when 'events' actually change.
  const metrics = useMemo(() => {
    if (events.length === 0) return { hours: 0, mins: 0 };
    return calculateRWT(events);
  }, [events]);

  const copyToClipboard = () => {
    const text = `RWT for ${ticketId}: ${metrics.hours}h ${metrics.mins}m`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto flex flex-col gap-8 font-sans">

      {/* Utility Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">RWT Calculator</h1>
          <p className="text-sm text-zinc-400 mt-1">DevRev SLA active business hours telemetry.</p>
        </div>

        <form onSubmit={handleFetch} className="flex w-full md:w-auto gap-3">
          <div className="relative flex-grow md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="e.g. 310830"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-md pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 font-mono transition-all"
              required
              disabled={status === 'loading'}
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-zinc-200 text-zinc-900 hover:bg-white px-5 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {status === 'loading' ? 'Processing...' : 'Calculate'}
          </button>
        </form>
      </header>

      {status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-md text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="font-mono">{errorMsg}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">

          {/* Left Column: Output & Rules */}
          <div className="flex flex-col gap-8">

            {/* The Output Card */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 relative group">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Total Active Time</h2>
                <button
                  onClick={copyToClipboard}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 text-xs font-medium bg-zinc-800/50 px-2 py-1 rounded"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="flex items-baseline gap-1 tabular-nums">
                <span className="text-6xl font-medium text-zinc-100">{metrics.hours}</span>
                <span className="text-zinc-500 font-mono text-sm mr-3">h</span>
                <span className="text-6xl font-medium text-zinc-100">{metrics.mins}</span>
                <span className="text-zinc-500 font-mono text-sm">m</span>
              </div>
            </div>

            {/* The Rules Card */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-zinc-400" /> Calculation Engine Rules
              </h3>
              <div className="text-sm text-zinc-400 space-y-4">
                <div>
                  <span className="text-zinc-300 font-medium block mb-1">1. State Triggers</span>
                  Timer starts strictly on <code className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded text-xs border border-zinc-700">Queued</code> and <code className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded text-xs border border-zinc-700">Waiting on Assignee</code>. Timer halts on <code className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded text-xs border border-zinc-700">Awaiting Customer Reply</code>.
                </div>
                <div>
                  <span className="text-zinc-300 font-medium block mb-1">2. Core Business Hours</span>
                  Time is only accumulated between <span className="text-zinc-200 font-mono">09:00</span> and <span className="text-zinc-200 font-mono">17:00</span>.
                </div>
                <div>
                  <span className="text-zinc-300 font-medium block mb-1">3. Weekend Exclusion</span>
                  Saturdays and Sundays are entirely skipped. The calculation cursor automatically leaps from Friday 17:00 to Monday 09:00.
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Telemetry Table */}
          <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-full max-h-[750px]">
            <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
              <h3 className="text-sm font-medium text-zinc-200">Raw DevRev Telemetry</h3>
              <span className="text-xs font-mono text-zinc-500">
                {events.length} State Changes
              </span>
            </div>

            <div className="overflow-y-auto overflow-x-auto p-0">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="sticky top-0 bg-zinc-950 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800 z-10">
                  <tr>
                    <th className="px-5 py-3 font-medium w-12">Seq</th>
                    <th className="px-5 py-3 font-medium">Local Timestamp</th>
                    <th className="px-5 py-3 font-medium">Previous Stage</th>
                    <th className="px-5 py-3 font-medium">New Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {events.map((ev, i) => (
                    <tr key={i} className="hover:bg-zinc-800/80 transition-colors">
                      <td className="px-5 py-3 text-zinc-600 font-mono text-xs border-r border-zinc-800/50 tabular-nums">
                        {(i + 1).toString().padStart(2, '0')}
                      </td>
                      <td className="px-5 py-3 text-zinc-300 font-mono tabular-nums">
                        {new Date(ev.timestamp).toLocaleString(undefined, {
                          weekday: 'short', month: 'short', day: '2-digit',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-zinc-400">{ev.from}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-zinc-100 font-medium">{ev.to}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}