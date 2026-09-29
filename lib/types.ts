export type GuardrailStatus = 'APPROVED' | 'FLAGGED_FOR_HUMAN_APPROVAL' | 'BLOCKED';

export type PaymentUrgency = 'low' | 'medium' | 'high' | 'critical';

export type PaymentCategory = 
  | 'Cloud Compute'
  | 'API Credits'
  | 'SaaS Subscription'
  | 'Office Supplies'
  | 'Contractor'
  | 'Domain & Hosting'
  | 'Security Audit'
  | 'Other';

export interface PaymentRequest {
  id?: string;
  amount: number; // In INR
  currency: string; // 'INR' default
  recipient: string;
  category: PaymentCategory | string;
  reason: string;
  urgency?: PaymentUrgency;
  agentId?: string;
  timestamp?: string;
}

export interface GuardrailCheckResult {
  name: string;
  category: 'VELOCITY' | 'SECURITY' | 'RECIPIENT' | 'AMOUNT_TIER';
  passed: boolean;
  scoreImpact: number; // 0 to 100 contribution
  message: string;
  details?: Record<string, unknown>;
}

export interface GuardrailEvaluation {
  status: GuardrailStatus;
  riskScore: number; // 0 (safest) to 100 (critical violation)
  checks: GuardrailCheckResult[];
  policyViolations: string[];
  explanation: string;
  evaluatedAt: string;
  requiresHumanReview: boolean;
}

export interface RazorpayOrder {
  id: string; // e.g. "order_1a2b3c4d5e6f"
  entity: 'order';
  amount: number; // in paise (e.g. 185000)
  amount_paid: number;
  amount_due: number;
  currency: string; // 'INR'
  receipt: string; // 'rcpt_xxxx'
  status: 'created' | 'attempted' | 'paid' | 'failed';
  attempts: number;
  notes: {
    agentId?: string;
    recipient: string;
    category: string;
    guardrailStatus: GuardrailStatus;
    riskScore: number;
    reason: string;
  };
  created_at: number; // UNIX epoch seconds
  mockPaymentId?: string; // e.g. "pay_9876543210"
  mockSignature?: string;
}

export interface TransactionRecord {
  id: string;
  timestamp: string;
  request: PaymentRequest;
  evaluation: GuardrailEvaluation;
  razorpayOrder?: RazorpayOrder;
  status: 'COMPLETED' | 'PENDING_APPROVAL' | 'REJECTED' | 'BLOCKED';
  humanDecision?: {
    action: 'APPROVED' | 'REJECTED';
    timestamp: string;
    reviewedBy: string;
    notes?: string;
  };
}

export interface VelocityConfig {
  softSingleTxnLimit: number; // > this triggers FLAGGED_FOR_HUMAN_APPROVAL (e.g., 10000)
  hardSingleTxnLimit: number; // > this triggers BLOCKED (e.g., 50000)
  maxHourlyVolume: number; // Rolling 1-hr spend limit (e.g., 75000)
  maxTransactionsPerMinute: number; // Burst limit (e.g., 3 tx/min)
  cooldownPeriodSeconds: number; // e.g., 10s between same-recipient bursts
}

export interface VelocityStats {
  rolling1HourVolume: number;
  rolling1MinuteTxCount: number;
  totalTransactionsToday: number;
  totalVolumeToday: number;
  activePendingReviewCount: number;
  blockedCount: number;
}
