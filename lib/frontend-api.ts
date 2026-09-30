import type { GuardrailCheckResult, TransactionRecord, VelocityConfig, VelocityStats } from '@/lib/types';

export interface PaymentsResponse {
  transactions: TransactionRecord[];
  pending: TransactionRecord[];
  stats: VelocityStats;
  config: VelocityConfig;
}

export interface GuardrailsResponse {
  config: VelocityConfig;
  stats: VelocityStats;
}

export interface PaymentExecutionResult {
  status: 'APPROVED' | 'AWAITING_HUMAN_CONFIRMATION' | 'POLICY_REJECTED' | 'FLAGGED_FOR_HUMAN_APPROVAL' | 'BLOCKED';
  riskScore: number;
  violations?: string[];
  explanation: string;
  checks: GuardrailCheckResult[];
  recordId: string;
  orderId: string;
  amountInr: number;
  mode: string;
  message: string;
  receipt?: string;
  requiresHumanReview?: boolean;
}

export interface ChatResponse {
  success: boolean;
  decisionTrace: string[];
  agentResponse: string;
  intentSource: 'AI_MODEL' | 'DETERMINISTIC_FALLBACK' | 'EXPLICIT_PARAMETERS';
  intentModel?: string;
  intentSummary: string;
  fallbackNote?: string;
  toolCall: {
    name: string;
    parameters: {
      amount: number;
      recipient: string;
      category: string;
      reason: string;
      urgency: string;
    };
    result: PaymentExecutionResult;
  };
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

export async function getPayments(): Promise<PaymentsResponse> {
  return requestJson<PaymentsResponse>('/api/payments');
}

export async function getGuardrails(): Promise<GuardrailsResponse> {
  return requestJson<GuardrailsResponse>('/api/guardrails');
}

export interface PaymentOverride {
  amount: number;
  recipient: string;
  category: string;
  reason?: string;
}

export async function submitPaymentPrompt(prompt: string, paymentOverride?: PaymentOverride): Promise<ChatResponse> {
  return requestJson<ChatResponse>('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ...paymentOverride }),
  });
}

export async function reviewPayment(id: string, action: 'approve' | 'reject'): Promise<void> {
  await requestJson('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, id, reviewedBy: 'Sentinel Pay demo operator' }),
  });
}

export async function resetDemo(): Promise<void> {
  await requestJson('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reset' }),
  });
}
