import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
    baseUrl: string;
    searchParams?: Record<string, string>;
}

export default function Pagination({ currentPage, totalPages, totalItems, perPage, baseUrl, searchParams = {} }: PaginationProps) {
    if (totalPages <= 1) return null;

    const buildUrl = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', String(page));
        return `${baseUrl}?${params.toString()}`;
    };

    const start = (currentPage - 1) * perPage + 1;
    const end = Math.min(currentPage * perPage, totalItems);

    // Show max 5 page numbers centered around current
    const pageNumbers: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    const endPage = Math.min(totalPages, startPage + maxPages - 1);
    if (endPage - startPage + 1 < maxPages) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-white border rounded-xl">
            <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{start}</span> to <span className="font-medium">{end}</span> of{' '}
                <span className="font-medium">{totalItems}</span> results
            </p>
            <nav className="flex items-center gap-1">
                {currentPage > 1 && (
                    <Link href={buildUrl(currentPage - 1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                        <ChevronLeft className="w-4 h-4" />
                    </Link>
                )}
                {pageNumbers.map((page) => (
                    <Link
                        key={page}
                        href={buildUrl(page)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${page === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        {page}
                    </Link>
                ))}
                {currentPage < totalPages && (
                    <Link href={buildUrl(currentPage + 1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                )}
            </nav>
        </div>
    );
}
