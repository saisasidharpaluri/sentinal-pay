import { NextResponse } from 'next/server';
import { 
  getAllTransactions, 
  getPendingTransactions, 
  approvePendingTransaction, 
  rejectPendingTransaction,
  clearAllTransactions 
} from '@/lib/store';
import { getVelocityStats, getVelocityConfig, resetVelocityLedger } from '@/lib/guardrails';

export async function GET() {
  const transactions = getAllTransactions();
  const pending = getPendingTransactions();
  const stats = getVelocityStats();
  const config = getVelocityConfig();

  return NextResponse.json({
    transactions,
    pending,
    stats,
    config,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, reviewedBy, notes } = body;

    if (action === 'approve') {
      if (!id) {
        return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });
      }
      const updated = await approvePendingTransaction(id, reviewedBy, notes);
      if (!updated) {
        return NextResponse.json({ error: 'Transaction not found or not pending' }, { status: 404 });
      }
      return NextResponse.json({ success: true, transaction: updated });
    }

    if (action === 'reject') {
      if (!id) {
        return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });
      }
      const updated = rejectPendingTransaction(id, reviewedBy, notes);
      if (!updated) {
        return NextResponse.json({ error: 'Transaction not found or not pending' }, { status: 404 });
      }
      return NextResponse.json({ success: true, transaction: updated });
    }

    if (action === 'reset') {
      clearAllTransactions();
      resetVelocityLedger();
      return NextResponse.json({ success: true, message: 'Ledger and state reset successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
