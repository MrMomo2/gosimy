'use client';

import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Key, Copy, Check, AlertCircle } from 'lucide-react';

export function TwoFactorSetup({ 
    enabled, 
    secret,
    email 
}: { 
    enabled: boolean; 
    secret: string | null;
    email: string;
}) {
    const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'disable'>('status');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [manualCode, setManualCode] = useState<string | null>(null);
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);

    useEffect(() => {
        if (secret && !enabled) {
            generateQRCode();
        }
    }, [secret]);

    const generateQRCode = async () => {
        try {
            const res = await fetch('/api/admin/2fa/setup', { method: 'POST' });
            const data = await res.json();
            if (data.qrCode) {
                setQrCode(data.qrCode);
                setManualCode(data.manualCode);
            }
        } catch (err) {
            setError('Failed to generate QR code');
        }
    };

    const handleEnable = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/2fa/enable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            const data = await res.json();
            if (data.success) {
                setBackupCodes(data.backupCodes || []);
                setStep('status');
                window.location.reload();
            } else {
                setError(data.error || 'Failed to enable 2FA');
            }
        } catch (err) {
            setError('Failed to enable 2FA');
        }
        setLoading(false);
    };

    const handleDisable = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/2fa/disable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            const data = await res.json();
            if (data.success) {
                setStep('status');
                window.location.reload();
            } else {
                setError(data.error || 'Failed to disable 2FA');
            }
        } catch (err) {
            setError('Failed to disable 2FA');
        }
        setLoading(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (step === 'status' && enabled) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Two-Factor Authentication Enabled</h3>
                <p className="text-gray-500 mb-6">Your account is protected with 2FA</p>
                <button
                    onClick={() => setStep('disable')}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                    Disable 2FA
                </button>
            </div>
        );
    }

    if (step === 'disable') {
        return (
            <div className="max-w-md mx-auto">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Disable Two-Factor Authentication</h3>
                    <p className="text-gray-500 text-sm mt-2">Enter your current 2FA code to disable</p>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500"
                            maxLength={6}
                        />
                    </div>
                    
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    
                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep('status')}
                            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDisable}
                            disabled={token.length !== 6 || loading}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Disabling...' : 'Disable 2FA'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'verify' || step === 'setup') {
        return (
            <div className="max-w-md mx-auto">
                {backupCodes.length > 0 ? (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">2FA Enabled Successfully!</h3>
                        <p className="text-gray-500 text-sm mb-6">Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator.</p>
                        
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                                {backupCodes.map((code, i) => (
                                    <div key={i} className="bg-white p-2 rounded border text-center">{code}</div>
                                ))}
                            </div>
                        </div>
                        
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <>
                        {qrCode && (
                            <div className="text-center mb-6">
                                <div className="bg-white p-4 rounded-lg inline-block border mb-4">
                                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                                </div>
                                <p className="text-gray-500 text-sm mb-4">Scan this QR code with your authenticator app</p>
                                
                                {manualCode && (
                                    <div className="bg-gray-50 p-3 rounded-lg inline-flex items-center gap-2">
                                        <code className="text-sm text-gray-700 break-all">{manualCode}</code>
                                        <button
                                            onClick={() => copyToClipboard(manualCode)}
                                            className="p-1 hover:bg-gray-200 rounded"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Enter verification code</label>
                                <input
                                    type="text"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    maxLength={6}
                                />
                            </div>
                            
                            {error && <p className="text-red-600 text-sm">{error}</p>}
                            
                            <button
                                onClick={handleEnable}
                                disabled={token.length !== 6 || loading}
                                className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Verifying...' : 'Enable 2FA'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Two-Factor Authentication</h3>
            <p className="text-gray-500 mb-6">Add an extra layer of security to your account</p>
            <button
                onClick={() => {
                    setStep('setup');
                    if (!secret) generateQRCode();
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                Enable 2FA
            </button>
        </div>
    );
}
