import { TransactionRecord, PaymentRequest, GuardrailEvaluation, RazorpayOrder } from './types';
import { recordSettledTransaction, decrementPendingCount } from './guardrails';
import { createRazorpayOrder, captureMockPayment } from './razorpay';

// Global singleton in-memory store for server runtime (preserves state during hot reload)
declare global {
  // eslint-disable-next-line no-var
  var __sentinelStore: {
    transactions: TransactionRecord[];
  } | undefined;
}

if (!globalThis.__sentinelStore) {
  globalThis.__sentinelStore = {
    transactions: [],
  };
}

export const store = globalThis.__sentinelStore;

export function getAllTransactions(): TransactionRecord[] {
  return [...store.transactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getPendingTransactions(): TransactionRecord[] {
  return store.transactions.filter(t => t.status === 'PENDING_APPROVAL');
}

export function addTransaction(record: TransactionRecord): TransactionRecord {
  store.transactions.unshift(record);
  return record;
}

export async function approvePendingTransaction(
  id: string, 
  reviewedBy = 'Sentinel Security Officer',
  notes = 'Approved via Operator HITL Command'
): Promise<TransactionRecord | null> {
  const tx = store.transactions.find(t => t.id === id);
  if (!tx || tx.status !== 'PENDING_APPROVAL') {
    return null;
  }

  // Create Razorpay Order
  const order = await createRazorpayOrder({
    amount: tx.request.amount,
    currency: tx.request.currency,
    recipient: tx.request.recipient,
    category: tx.request.category,
    reason: tx.request.reason,
    guardrailStatus: 'APPROVED',
    riskScore: tx.evaluation.riskScore,
  });

  // Capture mock payment
  await captureMockPayment(order);

  // Record into velocity ledger
  recordSettledTransaction(tx.request.amount, tx.request.recipient);
  decrementPendingCount();

  tx.status = 'COMPLETED';
  tx.razorpayOrder = order;
  tx.humanDecision = {
    action: 'APPROVED',
    timestamp: new Date().toISOString(),
    reviewedBy,
    notes,
  };

  return tx;
}

export function rejectPendingTransaction(
  id: string, 
  reviewedBy = 'Sentinel Security Officer',
  notes = 'Declined by Operator Review'
): TransactionRecord | null {
  const tx = store.transactions.find(t => t.id === id);
  if (!tx || tx.status !== 'PENDING_APPROVAL') {
    return null;
  }

  decrementPendingCount();
  tx.status = 'REJECTED';
  tx.humanDecision = {
    action: 'REJECTED',
    timestamp: new Date().toISOString(),
    reviewedBy,
    notes,
  };

  return tx;
}

export function clearAllTransactions() {
  store.transactions = [];
}
