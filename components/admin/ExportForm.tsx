'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';

const RESOURCES = [
    { id: 'orders', label: 'Orders', description: 'Export all order data' },
    { id: 'customers', label: 'Customers', description: 'Export customer summary' },
    { id: 'esims', label: 'eSIMs', description: 'Export eSIM data and usage' },
    { id: 'refunds', label: 'Refunds', description: 'Export refund requests' },
];

const STATUSES: Record<string, string[]> = {
    orders: ['all', 'pending', 'paid', 'fulfilling', 'fulfilled', 'failed', 'refunded'],
    esims: ['all', 'pending', 'provisioning', 'active', 'exhausted', 'expired', 'cancelled', 'failed'],
    refunds: ['all', 'pending', 'approved', 'rejected', 'processed'],
    customers: ['all'],
};

export function ExportForm() {
    const [resource, setResource] = useState('orders');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState('all');
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ resource });
            if (startDate) params.set('start', startDate);
            if (endDate) params.set('end', endDate);
            if (status !== 'all') params.set('status', status);

            const response = await fetch(`/api/admin/export?${params.toString()}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${resource}-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (err) {
            console.error('Export failed:', err);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Export Type</label>
                <div className="grid grid-cols-2 gap-3">
                    {RESOURCES.map((r) => (
                        <button
                            key={r.id}
                            onClick={() => {
                                setResource(r.id);
                                setStatus('all');
                            }}
                            className={`p-4 border rounded-lg text-left transition-colors ${
                                resource === r.id 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className={`w-5 h-5 ${resource === r.id ? 'text-blue-600' : 'text-gray-400'}`} />
                                <div>
                                    <p className="font-medium text-gray-900">{r.label}</p>
                                    <p className="text-xs text-gray-500">{r.description}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {(STATUSES[resource] || ['all']).map((s) => (
                            <option key={s} value={s}>
                                {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <button
                onClick={handleExport}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Download className="w-5 h-5" />
                )}
                {loading ? 'Exporting...' : 'Export CSV'}
            </button>
        </div>
    );
}
