import { useRef, useEffect } from 'react';

export function SearchBar({ ticketId, setTicketId, onSearch, isLoading }) {
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    return (
        <form onSubmit={onSearch} className="flex w-full md:w-auto gap-3">
            <input
                ref={inputRef}
                type="text"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                placeholder="Ticket ID (e.g. 310830)"
                className="w-full md:w-80 bg-transparent border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 font-mono transition-all"
                required
                disabled={isLoading}
            />
            <button
                type="submit"
                disabled={isLoading}
                className="bg-white text-black hover:bg-zinc-200 px-4 py-1.5 rounded-md text-sm font-medium disabled:opacity-50 transition-colors whitespace-nowrap"
            >
                {isLoading ? 'Fetching...' : 'Calculate'}
            </button>
        </form>
    );
}