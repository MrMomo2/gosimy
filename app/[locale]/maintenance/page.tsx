import { Plane, Globe, Wifi, Sparkles } from 'lucide-react';

export default function MaintenancePage() {
    return (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 text-white flex flex-col items-center justify-center p-4 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl opacity-50" />
            </div>

            <div className="relative z-10 text-center max-w-2xl mx-auto flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center mb-10 shadow-lg shadow-blue-500/20 transform -rotate-12">
                    <Plane className="w-10 h-10 text-white transform rotate-45" />
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
                    We're getting ready for takeoff
                </h1>

                <p className="text-xl text-gray-400 mb-12 max-w-xl mx-auto leading-relaxed">
                    Gosimy is launching soon with instant eSIMs tailored specifically for pilots, cabin crew, and frequent travelers.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-6 mb-16 text-sky-200/80">
                    <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10">
                        <Globe className="w-5 h-5" />
                        <span>100+ Countries</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10">
                        <Wifi className="w-5 h-5" />
                        <span>Instant Access</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10">
                        <Sparkles className="w-5 h-5" />
                        <span>No Roaming Fees</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
