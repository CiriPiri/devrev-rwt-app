import React, { useRef, useEffect, useState } from 'react';
import { Search, Loader2, ArrowRight } from 'lucide-react';

export function SearchBar({ ticketId, setTicketId, onSearch, isLoading, disabled }) {
    const inputRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);

    // Auto-focus on mount for power-user speed
    useEffect(() => {
        if (inputRef.current && !disabled) {
            inputRef.current.focus();
        }
    }, [disabled]);

    return (
        <form
            onSubmit={onSearch}
            className="relative flex flex-col sm:flex-row w-full sm:w-auto items-center gap-3 z-20"
        >
            {/* Input Wrapper */}
            <div
                className={`relative flex items-center w-full sm:w-[22rem] rounded-xl transition-all duration-300 backdrop-blur-md bg-surface-secondary/30 border ring-1 ring-white/5 overflow-hidden shadow-xl
                    ${isFocused && !disabled ? 'border-brand-cyan/50 shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 'border-surface-accent/50 hover:border-surface-accent'}
                    ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                `}
            >
                {/* Leading Icon */}
                <div className="pl-4 pr-2 text-text-muted flex-shrink-0 flex items-center justify-center">
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 text-brand-cyan animate-spin" />
                    ) : (
                        <Search className={`w-4 h-4 transition-colors duration-300 ${isFocused ? 'text-brand-cyan' : 'text-text-muted/70'}`} />
                    )}
                </div>

                {/* The Actual Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Enter Ticket ID (e.g. 310830)"
                    disabled={isLoading || disabled}
                    required
                    spellCheck="false"
                    autoComplete="off"
                    className="w-full bg-transparent py-3 pl-1 pr-12 text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none font-mono tracking-wide selection:bg-brand-cyan/30 disabled:cursor-not-allowed"
                />

                {/* Trailing Keyboard Hint (Hidden on mobile) */}
                <div className="absolute right-3 hidden sm:flex items-center pointer-events-none">
                    <kbd className={`font-sans text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors duration-300
                        ${isFocused ? 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan' : 'bg-surface-primary/50 border-surface-accent/50 text-text-muted/50'}
                    `}>
                        RET
                    </kbd>
                </div>
            </div>

            {/* Execute Button */}
            <button
                type="submit"
                disabled={isLoading || disabled}
                className={`group relative flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest overflow-hidden transition-all duration-300 shadow-lg
                    ${isLoading || disabled
                        ? 'bg-surface-accent/30 text-text-muted/50 border border-surface-accent/50 cursor-not-allowed'
                        : 'bg-text-primary text-surface-primary hover:scale-[1.02] active:scale-95 border border-transparent shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(34,211,238,0.3)]'}
                `}
                aria-label={isLoading ? 'Calculating metrics' : 'Calculate SLA Metrics'}
            >
                {/* Button Hover Gradient Injection */}
                {!isLoading && !disabled && (
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan/20 to-brand-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}

                <span className="relative z-10">{isLoading ? 'Processing' : 'Calculate'}</span>

                {!isLoading && !disabled && (
                    <ArrowRight className="w-3.5 h-3.5 relative z-10 -ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                )}
            </button>
        </form>
    );
}