import Link from 'next/link';
import { MapPin, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950">
            <div className="min-h-screen flex items-center justify-center px-4 relative">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
                </div>

                <div className="relative text-center max-w-lg">
                    {/* Icon */}
                    <div className="w-24 h-24 mx-auto mb-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-blue-400" />
                    </div>

                    {/* Error code */}
                    <h1 className="text-8xl font-extrabold text-white/10 mb-2 tracking-tight">404</h1>

                    {/* Message */}
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                        Page Not Found
                    </h2>
                    <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                        Looks like this destination doesn&apos;t exist yet.
                        Let&apos;s get you back on track.
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25"
                        >
                            <Home className="w-5 h-5" />
                            Go Home
                        </Link>
                        <Link
                            href="/en/shop"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm text-white font-semibold rounded-xl transition-all duration-200 border border-white/10"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Browse eSIMs
                        </Link>
                    </div>
                </div>
            </div>
        </div >
    );
}
