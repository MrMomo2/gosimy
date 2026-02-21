'use client';

import { useEffect, useState } from 'react';

interface Stats {
    totalRevenue: number;
    totalOrders: number;
    activeEsims: number;
    pendingOrders: number;
    failedOrders: number;
}

interface LiveIndicatorProps {
    initialStats: Stats;
}

export default function LiveIndicator({ initialStats }: LiveIndicatorProps) {
    const [stats, setStats] = useState(initialStats);
    const [isLive, setIsLive] = useState(true);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/admin/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                    setIsLive(true);
                }
            } catch {
                setIsLive(false);
            }
        }, 30_000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {isLive ? 'Live' : 'Offline'}
            <span className="text-gray-300">|</span>
            <span>{stats.pendingOrders} pending</span>
            {stats.failedOrders > 0 && (
                <>
                    <span className="text-gray-300">|</span>
                    <span className="text-red-500 font-medium">{stats.failedOrders} failed</span>
                </>
            )}
        </div>
    );
}
