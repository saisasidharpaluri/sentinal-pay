import { RazorpayOrder, GuardrailStatus } from './types';
import crypto from 'crypto';

export interface CreateOrderParams {
  amount: number; // in INR
  currency?: string; // default 'INR'
  recipient: string;
  category?: string;
  reason: string;
  agentId?: string;
  riskScore?: number;
  guardrailStatus?: GuardrailStatus;
  receipt?: string;
}

export interface MockPaymentResult {
  paymentId: string;
  orderId: string;
  signature: string;
  status: 'paid';
  amount: number;
  currency: string;
  receiptUrl: string;
  capturedAt: number;
}

/**
 * Generate a cryptographically random Razorpay-formatted ID
 */
function generateRazorpayId(prefix: 'order_' | 'pay_' | 'rcpt_'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomBytes = crypto.randomBytes(14);
  for (let i = 0; i < 14; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return `${prefix}${result}`;
}

/**
 * Generate Razorpay verification signature: HMAC SHA256(order_id + "|" + payment_id, secret)
 */
export function generateRazorpaySignature(orderId: string, paymentId: string, secret = 'mock_rzp_secret_sentinel'): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

/**
 * Mock / Test Razorpay Order Generator
 * Conforms to standard Razorpay Orders API specification
 */
export async function createRazorpayOrder(params: CreateOrderParams): Promise<RazorpayOrder> {
  const currency = params.currency || 'INR';
  // Razorpay amounts are represented in the smallest currency sub-unit (paise for INR, 1 INR = 100 paise)
  const amountInPaise = Math.round(params.amount * 100);
  const orderId = generateRazorpayId('order_');
  const receiptId = params.receipt || generateRazorpayId('rcpt_');
  const createdAtEpoch = Math.floor(Date.now() / 1000);

  const mockPaymentId = generateRazorpayId('pay_');
  const mockSignature = generateRazorpaySignature(orderId, mockPaymentId);

  const order: RazorpayOrder = {
    id: orderId,
    entity: 'order',
    amount: amountInPaise,
    amount_paid: 0,
    amount_due: amountInPaise,
    currency,
    receipt: receiptId,
    status: 'created',
    attempts: 0,
    notes: {
      agentId: params.agentId || 'sentinel-autonomous-agent-01',
      recipient: params.recipient,
      category: params.category || 'Autonomous Procurement',
      guardrailStatus: params.guardrailStatus || 'APPROVED',
      riskScore: params.riskScore ?? 10,
      reason: params.reason,
    },
    created_at: createdAtEpoch,
    mockPaymentId,
    mockSignature,
  };

  return order;
}

/**
 * Simulate payment settlement / capture for the generated Razorpay order
 */
export async function captureMockPayment(order: RazorpayOrder): Promise<MockPaymentResult> {
  const paymentId = order.mockPaymentId || generateRazorpayId('pay_');
  const signature = order.mockSignature || generateRazorpaySignature(order.id, paymentId);

  order.status = 'paid';
  order.amount_paid = order.amount;
  order.amount_due = 0;
  order.attempts = 1;

  return {
    paymentId,
    orderId: order.id,
    signature,
    status: 'paid',
    amount: order.amount / 100, // INR
    currency: order.currency,
    receiptUrl: `https://sentinel-pay.local/receipts/${order.receipt}`,
    capturedAt: Math.floor(Date.now() / 1000),
  };
}

/**
 * Verify Razorpay payment signature
 */
export function verifyRazorpaySignature(
  orderId: string, 
  paymentId: string, 
  signature: string, 
  secret = 'mock_rzp_secret_sentinel'
): boolean {
  const expectedSignature = generateRazorpaySignature(orderId, paymentId, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(expectedSignature, 'utf8')
  );
}
