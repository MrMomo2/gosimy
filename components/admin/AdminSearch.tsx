'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { Search, X } from 'lucide-react';

interface AdminSearchProps {
    placeholder?: string;
    paramName?: string;
}

export default function AdminSearch({ placeholder = 'Search...', paramName = 'q' }: AdminSearchProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [value, setValue] = useState(searchParams.get(paramName) ?? '');

    const updateSearch = useCallback(
        (term: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (term) {
                params.set(paramName, term);
                params.delete('page'); // Reset pagination on search
            } else {
                params.delete(paramName);
            }
            startTransition(() => {
                router.replace(`${pathname}?${params.toString()}`);
            });
        },
        [searchParams, router, pathname, paramName],
    );

    useEffect(() => {
        const timer = setTimeout(() => updateSearch(value), 300);
        return () => clearTimeout(timer);
    }, [value, updateSearch]);

    return (
        <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isPending ? 'text-blue-400 animate-pulse' : 'text-gray-400'}`} />
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-72 text-sm bg-white"
            />
            {value && (
                <button
                    onClick={() => setValue('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
