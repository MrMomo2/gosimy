'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    activeTicketId: string | null;
    setActiveTicketId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

    // If we open a specific ticket, ensure the chat window is open
    const handleSetActiveTicketId = (id: string | null) => {
        setActiveTicketId(id);
        if (id) setIsOpen(true);
    };

    return (
        <ChatContext.Provider value={{ isOpen, setIsOpen, activeTicketId, setActiveTicketId: handleSetActiveTicketId }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
