'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';

interface ExportCSVProps {
    resource: 'orders' | 'customers' | 'esims';
    label?: string;
}

export default function ExportCSV({ resource, label = 'Export CSV' }: ExportCSVProps) {
    const [loading, setLoading] = useState(false);

    async function handleExport() {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/export?resource=${resource}`);
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${resource}-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Export error:', e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleExport}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
            <Download className={`w-4 h-4 ${loading ? 'animate-bounce' : ''}`} />
            {loading ? 'Exporting...' : label}
        </button>
    );
}
