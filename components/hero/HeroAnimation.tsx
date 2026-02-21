'use client';

export default function HeroAnimation() {
    return (
        <div className="relative w-full max-w-md mx-auto select-none" style={{ perspective: '1200px' }}>
            {/* Glowing orbs background */}
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl animate-pulse-glow" />
            <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

            {/* Floating WiFi signals */}
            <svg className="absolute -top-4 right-4 w-10 h-10 text-blue-400/60 animate-float" style={{ animationDuration: '4s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" fill="currentColor" />
            </svg>
            <svg className="absolute top-1/4 -left-6 w-8 h-8 text-indigo-400/50 animate-float" style={{ animationDuration: '5s', animationDelay: '0.7s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" fill="currentColor" />
            </svg>

            {/* Modern Premium Phone Frame (Titanium Look) */}
            <div className="relative mx-auto w-[280px] h-[580px] bg-gradient-to-br from-gray-700 via-gray-900 to-black rounded-[3.5rem] p-[3px] shadow-2xl hero-phone-float z-10">
                {/* Hardware Buttons */}
                <div className="absolute top-32 -left-[4px] w-1 h-12 bg-gray-700 rounded-l-md" />
                <div className="absolute top-48 -left-[4px] w-1 h-12 bg-gray-700 rounded-l-md" />
                <div className="absolute top-36 -right-[4px] w-1 h-16 bg-gray-700 rounded-r-md" />

                {/* Inner Bezel */}
                <div className="relative w-full h-full bg-black rounded-[3.3rem] p-[8px] overflow-hidden">
                    {/* Screen glare effect */}
                    <div className="hero-screen-glare" />

                    {/* Screen Content */}
                    <div className="relative w-full h-full bg-slate-950 rounded-[2.8rem] overflow-hidden flex flex-col justify-between">
                        {/* Background Map / Mesh Pattern */}
                        <div className="absolute inset-0 opacity-40 mesh-gradient pointer-events-none" />

                        {/* Dynamic Island */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 h-7 bg-black rounded-full hero-dynamic-island flex items-center justify-between px-2 z-50 shadow-md border border-white/5">
                            {/* Camera lens reflection */}
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-900/50 ml-1 border border-indigo-500/20" />
                            {/* Activation Indicator Dot (Green) */}
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_#22c55e]" />
                        </div>

                        {/* Status Bar */}
                        <div className="flex justify-between w-full px-6 pt-4 pb-2 relative z-40">
                            <span className="text-white font-medium text-[12px] tracking-tight ml-1 mt-0.5">9:41</span>
                            <div className="flex items-center gap-1.5 mt-0.5 mr-1">
                                <div className="flex gap-[2px] items-end h-[10px]">
                                    {[0.4, 0.6, 0.8, 1].map((h, i) => (
                                        <div key={i} className="w-[3px] bg-white rounded-sm" style={{ height: `${h * 100}%` }} />
                                    ))}
                                </div>
                                <span className="text-white text-[10px] font-bold">5G</span>
                                <div className="w-6 h-3 border border-white/40 bg-white/10 rounded-[3px] p-[1px] flex relative opacity-80">
                                    <div className="h-full bg-white rounded-[1px] esim-battery-fill" />
                                    <div className="absolute -right-1 top-1 w-0.5 h-1 bg-white/40 rounded-r-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Main Screen UI */}
                        <div className="px-5 pb-8 relative z-30 flex-1 flex flex-col pt-8">

                            {/* Glassmorphic Top Notification */}
                            <div className="mb-auto mt-4 mx-auto w-full max-w-[200px] bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-3 px-4 shadow-xl esim-card-slide flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="w-4 h-4" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12l5 5L20 7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-white text-[11px] font-bold leading-tight">eSIM Ready</p>
                                    <p className="text-white/60 text-[9px] leading-tight">Plan configured</p>
                                </div>
                            </div>

                            {/* Centered Check Animation */}
                            <div className="flex flex-col items-center justify-center my-6">
                                <div className="relative w-24 h-24 esim-check-appear">
                                    {/* Animated ring */}
                                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 80">
                                        <circle cx="40" cy="40" r="36" fill="none" stroke="url(#grad)" strokeWidth="4" strokeLinecap="round"
                                            strokeDasharray="226" strokeDashoffset="226" className="esim-circle" />
                                        <defs>
                                            <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#60a5fa" />
                                                <stop offset="100%" stopColor="#a78bfa" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    {/* Success Checkmark inside circle */}
                                    <svg className="absolute inset-0 w-full h-full p-6" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12l5 5L20 7" strokeDasharray="30" strokeDashoffset="30" className="esim-check-path" />
                                    </svg>
                                </div>
                                <h3 className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 text-lg font-bold tracking-wide mt-4 esim-text-fade" style={{ animationDelay: '2.1s' }}>Welcome to Gosimy</h3>
                            </div>

                            {/* Premium Glassmorphic Plan Card */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-[1.5rem] p-5 border border-white/10 shadow-2xl esim-card-slide relative overflow-hidden" style={{ animationDelay: '2.4s' }}>
                                {/* Card Highlight inside */}
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white shadow-inner border border-white/20">
                                            🌍
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-bold">Global Data</p>
                                            <p className="text-blue-300 text-[11px] font-medium">Auto-connecting...</p>
                                        </div>
                                    </div>
                                    <div className="px-2 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[9px] font-bold uppercase tracking-wider">
                                        Active
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10">
                                    {[
                                        { label: 'Data', value: '10 GB' },
                                        { label: 'Valid', value: '30 Days' },
                                        { label: 'Speed', value: '5G' },
                                    ].map((item, i) => (
                                        <div key={i} className="text-center py-2 bg-black/20 rounded-xl border border-white/5">
                                            <p className="text-white text-xs font-bold">{item.value}</p>
                                            <p className="text-white/40 text-[9px] uppercase tracking-wider mt-0.5">{item.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Connecting indicator at the bottom */}
                        <div className="w-1/3 mx-auto h-1.5 bg-white/20 rounded-full mb-2 overflow-hidden relative">
                            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full w-full esim-pulse-line shadow-[0_0_10px_#3b82f6]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Floating eSIM chip */}
            <div className="absolute bottom-20 -right-8 w-16 h-12 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-lg shadow-2xl shadow-yellow-600/40 esim-chip-float border border-yellow-300/60 z-20 flex items-center justify-center perspective-[500px]">
                <div className="absolute inset-1 border border-[#DAA520] rounded-md bg-gradient-to-br from-yellow-300/20 to-transparent" />
                {/* Microchip circuits */}
                <div className="relative w-full h-full flex flex-col items-center justify-center gap-[3px] opacity-80">
                    <div className="w-8 h-1 bg-[#8B6508] rounded-full" />
                    <div className="flex gap-2">
                        <div className="w-3 h-3 bg-[#8B6508] rounded-sm" />
                        <div className="w-3 h-3 bg-[#8B6508] rounded-sm" />
                    </div>
                    <div className="w-8 h-1 bg-[#8B6508] rounded-full" />
                </div>
                {/* 3D glare */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent rounded-lg" />
            </div>

            {/* Connection lines from chip to phone */}
            <div className="absolute bottom-24 right-4 w-12 h-[2px] bg-gradient-to-l from-[#FFD700] to-transparent esim-pulse-line z-0 shadow-[0_0_8px_#FFD700]" />
        </div>
    );
}
