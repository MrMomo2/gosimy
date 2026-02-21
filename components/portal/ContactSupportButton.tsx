'use client';

import { MessageCircle } from 'lucide-react';
import { useChat } from './chat/ChatProvider';

export function ContactSupportButton({ style = 'primary' }: { locale?: string, style?: 'primary' | 'ghost' }) {
    const { setIsOpen } = useChat();

    const className = style === 'primary'
        ? 'btn-primary'
        : 'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors shadow-sm';

    return (
        <button onClick={() => setIsOpen(true)} className={className}>
            <MessageCircle className="w-4 h-4" />
            Contact Support
        </button>
    );
}
