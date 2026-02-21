import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const secret = request.nextUrl.searchParams.get('secret');
    const remove = request.nextUrl.searchParams.get('remove');

    // Simple bypass secret password
    if (secret !== 'gosimy42') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = NextResponse.redirect(new URL('/en', request.url));

    if (remove === 'true') {
        response.cookies.delete('admin_bypass');
    } else {
        response.cookies.set({
            name: 'admin_bypass',
            value: 'true',
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });
    }

    return response;
}
