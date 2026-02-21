// GET /api/admin/balance
// Returns the current eSIM Access account balance.
// Protected by ADMIN_API_KEY header — never expose this route publicly.
//
// Header: x-admin-key: <ADMIN_API_KEY>

import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/providers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey) {
    console.error('[admin/balance] ADMIN_API_KEY env var is not set');
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  if (!adminKey || adminKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = getProvider('esim_access');
    const balance = await provider.getBalance();

    return NextResponse.json({
      amount: balance.amount,
      currency: balance.currency,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[admin/balance] Failed:', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
