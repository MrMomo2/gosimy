'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, CheckCircle, Wifi, Calendar, Activity, QrCode } from 'lucide-react';

interface EsimCardProps {
  id: string;
  iccid: string | null;
  qrCodeUrl: string | null;
  activationCode: string | null;
  status: string;
  dataUsedBytes: string | null;
  dataTotalBytes: string | null;
  expiresAt: string | null;
  packageName: string;
  countryCode: string;
  provider: string;
}

function formatBytes(bytes: string | null): string {
  if (!bytes) return '—';
  const b = Number(bytes);
  if (b >= 1073741824) return `${(b / 1073741824).toFixed(2)} GB`;
  if (b >= 1048576) return `${(b / 1048576).toFixed(0)} MB`;
  return `${b} B`;
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  provisioning: { label: 'Provisioning', className: 'bg-sky-100 text-sky-700 border-sky-200' },
  active: { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200' },
  exhausted: { label: 'Data Used', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  expired: { label: 'Expired', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200' },
};

const FLAG_BASE = 0x1F1E6 - 65;
function getFlag(code: string) {
  if (code.length !== 2) return '🌍';
  return code.toUpperCase().split('').map(c => String.fromCodePoint(FLAG_BASE + c.charCodeAt(0))).join('');
}

export function EsimCard({
  id, iccid, qrCodeUrl, activationCode, status,
  dataUsedBytes, dataTotalBytes, expiresAt, packageName, countryCode, provider,
}: EsimCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const copy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const statusConfig = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  const flag = getFlag(countryCode);

  const usedNum = dataUsedBytes ? Number(dataUsedBytes) : 0;
  const totalNum = dataTotalBytes ? Number(dataTotalBytes) : 0;
  const usagePct = totalNum > 0 ? Math.min(100, Math.round((usedNum / totalNum) * 100)) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-50 to-blue-100 rounded-xl flex items-center justify-center text-2xl">
            {flag}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{packageName}</p>
            <p className="text-xs text-gray-500">{provider.replace('_', ' ')}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${statusConfig.className}`}>
          {statusConfig.label}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {totalNum > 0 && (
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="flex items-center gap-1.5 text-gray-500">
                <Activity className="w-4 h-4 text-sky-500" />
                Data Usage
              </span>
              <span className="font-semibold text-gray-900">{formatBytes(dataUsedBytes)} / {formatBytes(dataTotalBytes)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  usagePct > 80 ? 'bg-red-500' : usagePct > 50 ? 'bg-amber-400' : 'bg-gradient-to-r from-sky-500 to-blue-500'
                }`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        )}

        {expiresAt && (
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-2.5">
            <Calendar className="w-4 h-4 text-sky-500" />
            Expires {new Date(expiresAt).toLocaleDateString()}
          </div>
        )}

        {iccid && (
          <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">ICCID</p>
              <p className="text-sm font-mono font-medium text-gray-900 truncate">{iccid}</p>
            </div>
            <button
              onClick={() => copy(iccid, 'iccid')}
              className="p-2 rounded-lg hover:bg-white transition-colors flex-shrink-0"
              aria-label="Copy ICCID"
            >
              {copiedField === 'iccid' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        )}

        {activationCode && (
          <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">Activation Code</p>
              <p className="text-sm font-mono font-medium text-gray-900 truncate">{activationCode}</p>
            </div>
            <button
              onClick={() => copy(activationCode, 'ac')}
              className="p-2 rounded-lg hover:bg-white transition-colors flex-shrink-0"
              aria-label="Copy activation code"
            >
              {copiedField === 'ac' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        )}

        {(qrCodeUrl || activationCode) && (
          <button
            onClick={() => setShowQr(!showQr)}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-sky-600 hover:text-sky-500 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors"
          >
            <QrCode className="w-4 h-4" />
            {showQr ? 'Hide QR Code' : 'Show QR Code'}
          </button>
        )}

        {showQr && (
          <div className="flex justify-center py-3 bg-white rounded-xl border border-gray-100">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="eSIM QR Code" className="w-44 h-44" />
            ) : activationCode ? (
              <QRCodeSVG value={activationCode} size={176} />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
