export const dynamic = 'force-dynamic';

import { getAdminUser } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { ExportForm } from '@/components/admin/ExportForm';
import { FileSpreadsheet, Clock } from 'lucide-react';

export default async function ExportPage() {
    const admin = await getAdminUser();
    
    if (!admin) {
        redirect('/en/auth/login?redirect=/admin/export');
    }

    return (
        <div className="max-w-3xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Export Data</h1>
                <p className="text-gray-600">Download your data as CSV files</p>
            </div>

            <div className="bg-white rounded-xl border p-6">
                <ExportForm />
            </div>

            <div className="bg-gray-50 rounded-xl border p-6">
                <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-gray-900 mb-1">Export Tips</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Leave dates empty to export all data</li>
                            <li>• Large exports may take a few seconds</li>
                            <li>• All exports are logged in the audit trail</li>
                            <li>• CSV files open in Excel, Google Sheets, or Numbers</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    Export Format Reference
                </h2>
                <div className="space-y-4 text-sm">
                    <div>
                        <h3 className="font-medium text-gray-900">Orders CSV</h3>
                        <p className="text-gray-600">ID, Status, Currency, Amount, Email, Locale, IP Address, Created, Updated</p>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">Customers CSV</h3>
                        <p className="text-gray-600">Email, Total Orders, Total Spent (USD), Last Order, IPs Used</p>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">eSIMs CSV</h3>
                        <p className="text-gray-600">ID, ICCID, Provider, Package, Country, Status, Total Data (MB), Used Data (MB), Expires, Created</p>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">Refunds CSV</h3>
                        <p className="text-gray-600">ID, Order ID, Amount (USD), Reason, Status, Created, Processed</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
