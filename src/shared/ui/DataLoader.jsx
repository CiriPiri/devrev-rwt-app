import { useState, useEffect } from 'react';

export function DataLoader({ isLoading }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        let interval;
        if (isLoading) {
            setElapsed(0);
            interval = setInterval(() => {
                setElapsed((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    if (!isLoading) return null;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center animate-pulse p-4">
            <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin mb-3"></div>
            <div className="flex items-center gap-2 text-sm text-zinc-300 font-medium">
                Analyzing <span className="font-mono text-zinc-500">[{elapsed}s]</span>
            </div>
            <div className="h-4 mt-1">
                {elapsed > 3 && (
                    <p className="text-xs text-zinc-500 animate-in fade-in">
                        Deep pagination active...
                    </p>
                )}
            </div>
        </div>
    );
}