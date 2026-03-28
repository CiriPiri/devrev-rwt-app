export function Skeleton({ className = '', ...props }) {
    return (
        <div
            className={`animate-pulse bg-zinc-900 border border-zinc-800/50 rounded-lg ${className}`}
            {...props}
        />
    );
}