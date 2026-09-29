import { NextResponse } from 'next/server';
import { tool } from 'ai';
import { z } from 'zod';
import { evaluateGuardrails, recordSettledTransaction } from '@/lib/guardrails';
import { createRazorpayOrder, captureMockPayment } from '@/lib/razorpay';
import { addTransaction } from '@/lib/store';
import { PaymentRequest, GuardrailCheckResult } from '@/lib/types';

export const paymentInputSchema = z.object({
  amount: z.number().describe('The payment amount in INR (Indian Rupee).'),
  recipient: z.string().describe('Target vendor or recipient organization name.'),
  category: z.string().describe('Expense category: e.g. Cloud Compute, API Credits, SaaS Subscription, Security Audit, etc.'),
  reason: z.string().describe('Clear business justification and purpose for this payment.'),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium').describe('Urgency level of this payment.'),
});

export type PaymentExecutionParams = z.infer<typeof paymentInputSchema>;

export interface PaymentToolResult {
  status: 'APPROVED' | 'FLAGGED_FOR_HUMAN_APPROVAL' | 'BLOCKED';
  riskScore: number;
  violations?: string[];
  explanation: string;
  checks: GuardrailCheckResult[];
  recordId: string;
  orderId?: string;
  paymentId?: string;
  receipt?: string;
  amount?: number;
  amountPaise?: number;
  currency?: string;
  signature?: string;
  requestId?: string;
  requiresHumanReview?: boolean;
  message: string;
}

/**
 * Core Autonomous Payment Execution Pipeline
 * Deterministically checks guardrails, records to ledger, and generates Razorpay settlement
 */
export async function executeAgentPayment(params: PaymentExecutionParams): Promise<PaymentToolResult> {
  const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  const paymentRequest: PaymentRequest = {
    id: reqId,
    amount: params.amount,
    currency: 'INR',
    recipient: params.recipient,
    category: params.category,
    reason: params.reason,
    urgency: params.urgency || 'medium',
    agentId: 'sentinel-agent-v1',
    timestamp,
  };

  // 1. Evaluate deterministic guardrails
  const evaluation = evaluateGuardrails(paymentRequest);

  // 2. Handle BLOCKED state
  if (evaluation.status === 'BLOCKED') {
    const record = addTransaction({
      id: reqId,
      timestamp,
      request: paymentRequest,
      evaluation,
      status: 'BLOCKED',
    });
    return {
      status: 'BLOCKED',
      riskScore: evaluation.riskScore,
      violations: evaluation.policyViolations,
      explanation: evaluation.explanation,
      checks: evaluation.checks,
      recordId: record.id,
      message: `[SENTINEL GATEWAY REJECTION] Transaction BLOCKED. Risk Score: ${evaluation.riskScore}/100. Violations: ${evaluation.policyViolations.join('; ')}`,
    };
  }

  // 3. Handle FLAGGED_FOR_HUMAN_APPROVAL state (HITL)
  if (evaluation.status === 'FLAGGED_FOR_HUMAN_APPROVAL') {
    const record = addTransaction({
      id: reqId,
      timestamp,
      request: paymentRequest,
      evaluation,
      status: 'PENDING_APPROVAL',
    });
    return {
      status: 'FLAGGED_FOR_HUMAN_APPROVAL',
      riskScore: evaluation.riskScore,
      requestId: reqId,
      requiresHumanReview: true,
      recordId: record.id,
      explanation: evaluation.explanation,
      checks: evaluation.checks,
      message: `[SENTINEL HITL REQUIRED] Payment of ₹${params.amount.toLocaleString()} to ${params.recipient} flagged for Human-in-the-Loop review. Authorization token ${reqId} dispatched to Operator Queue.`,
    };
  }

  // 4. Handle APPROVED state -> Generate Mock Razorpay Order and capture
  const razorpayOrder = await createRazorpayOrder({
    amount: params.amount,
    currency: 'INR',
    recipient: params.recipient,
    category: params.category,
    reason: params.reason,
    guardrailStatus: 'APPROVED',
    riskScore: evaluation.riskScore,
  });

  const paymentResult = await captureMockPayment(razorpayOrder);
  recordSettledTransaction(params.amount, params.recipient);

  const record = addTransaction({
    id: reqId,
    timestamp,
    request: paymentRequest,
    evaluation,
    razorpayOrder,
    status: 'COMPLETED',
  });

  return {
    status: 'APPROVED',
    riskScore: evaluation.riskScore,
    orderId: razorpayOrder.id,
    paymentId: paymentResult.paymentId,
    receipt: razorpayOrder.receipt,
    amount: razorpayOrder.amount / 100, // INR
    amountPaise: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    signature: paymentResult.signature,
    recordId: record.id,
    explanation: evaluation.explanation,
    checks: evaluation.checks,
    message: `[SENTINEL PAYMENT CLEARED] Successfully created and settled Razorpay Order ${razorpayOrder.id} for ₹${params.amount.toLocaleString()} to ${params.recipient}. Receipt: ${razorpayOrder.receipt}`,
  };
}

// Deterministic Vercel AI SDK Tool: request_agent_payment
export const requestAgentPaymentTool = tool({
  description: 
    'Execute or request an autonomous business payment settlement through the Sentinel-Pay gateway. ' +
    'Enforces real-time velocity limits, single transaction thresholds, and adversarial injection filters. ' +
    'Returns Razorpay order IDs and receipts when cleared, or flags for human approval if soft limits are exceeded.',
  inputSchema: paymentInputSchema,
  execute: async (input: PaymentExecutionParams): Promise<PaymentToolResult> => {
    return await executeAgentPayment(input);
  },
});

/**
 * Intelligent Agent Intent Extraction
 * Parses natural language instructions or evaluator presets to extract payment parameters
 */
function extractPaymentIntent(prompt: string): PaymentExecutionParams {
  let amount = 1500;
  const amountMatch = prompt.match(/(?:₹|rs\.?|inr|\$)?\s*([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)(?:\s*(?:inr|rs|rupees))?/i);
  if (amountMatch && amountMatch[1]) {
    const parsed = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
    }
  }

  let recipient = 'Vendor Partner';
  if (/aws|amazon web services/i.test(prompt)) recipient = 'Amazon Web Services (AWS)';
  else if (/anthropic/i.test(prompt)) recipient = 'Anthropic PBC';
  else if (/openai/i.test(prompt)) recipient = 'OpenAI LLC';
  else if (/server farm|hosting|cloud/i.test(prompt)) recipient = 'Cloud Hosting Infrastructure Inc';
  else if (/offshore|untracked|darknet|anonymous/i.test(prompt)) recipient = 'Untracked Offshore Wallet';
  else if (/google|gcp/i.test(prompt)) recipient = 'Google Cloud Platform';
  else if (/vercel/i.test(prompt)) recipient = 'Vercel Inc';
  else if (/github/i.test(prompt)) recipient = 'GitHub Inc';
  else {
    const toMatch = prompt.match(/(?:to|for|vendor|recipient)\s+([A-Za-z0-9\s&]{2,30})/i);
    if (toMatch && toMatch[1]) {
      recipient = toMatch[1].trim();
    }
  }

  let category = 'Cloud Compute';
  if (/api|tokens|inference|anthropic|openai/i.test(prompt)) category = 'API Credits';
  else if (/storage|s3|server|cluster|database/i.test(prompt)) category = 'Cloud Compute';
  else if (/subscription|saas|license|monthly/i.test(prompt)) category = 'SaaS Subscription';
  else if (/contractor|freelance|consultant/i.test(prompt)) category = 'Contractor';
  else if (/supplies|hardware|office/i.test(prompt)) category = 'Office Supplies';

  let urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (/urgent|critical|immediate|emergency|root/i.test(prompt)) urgency = 'critical';
  else if (/high|priority/i.test(prompt)) urgency = 'high';
  else if (/low|background/i.test(prompt)) urgency = 'low';

  return {
    amount,
    recipient,
    category,
    reason: prompt.trim(),
    urgency,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body.prompt || (Array.isArray(body.messages) ? body.messages[body.messages.length - 1]?.content : '');

    if (!prompt) {
      return NextResponse.json({ error: 'No prompt or messages provided' }, { status: 400 });
    }

    // Extract payment intent parameters
    const paymentIntent = extractPaymentIntent(prompt);

    // If explicit override params were provided in body (e.g. from preset buttons)
    if (body.amount !== undefined) paymentIntent.amount = Number(body.amount);
    if (body.recipient) paymentIntent.recipient = String(body.recipient);
    if (body.category) paymentIntent.category = String(body.category);
    if (body.reason) paymentIntent.reason = String(body.reason);
    if (body.urgency) paymentIntent.urgency = body.urgency;

    // Simulate Agent Chain of Thought & Tool Invocation
    const agentThoughts = [
      `[Agent Perception] Received operational directive: "${prompt}"`,
      `[Intent Analysis] Identified payment intent: ₹${paymentIntent.amount.toLocaleString()} to "${paymentIntent.recipient}" (${paymentIntent.category}).`,
      `[Security Checkpoint] Routing transaction through Sentinel-Pay Gateway via tool \`request_agent_payment\`...`,
    ];

    // Execute the Tool via the core pipeline
    const toolResult = await executeAgentPayment(paymentIntent);

    let agentResponse = '';
    if (toolResult.status === 'APPROVED') {
      agentResponse = `Autonomous procurement complete. Sentinel-Pay verified that this payment of ₹${paymentIntent.amount.toLocaleString()} to ${paymentIntent.recipient} satisfies all velocity and safety criteria (Risk Score: ${toolResult.riskScore}/100). Razorpay Order ID \`${toolResult.orderId}\` generated and settled under receipt \`${toolResult.receipt}\`.`;
    } else if (toolResult.status === 'FLAGGED_FOR_HUMAN_APPROVAL') {
      agentResponse = `Payment of ₹${paymentIntent.amount.toLocaleString()} exceeds the autonomous execution limit (₹10,000 threshold). Sentinel-Pay has placed the order in the Human-in-the-Loop review queue under Token \`${toolResult.requestId}\`. I will wait for human operator authorization before settlement proceeds.`;
    } else {
      agentResponse = `ACTION BLOCKED: Sentinel-Pay security policies rejected the payment attempt to "${paymentIntent.recipient}". High risk detected (${toolResult.riskScore}/100). Guardrail violations: ${toolResult.violations?.join(', ')}.`;
    }

    return NextResponse.json({
      success: true,
      agentThoughts,
      toolCall: {
        name: 'request_agent_payment',
        parameters: paymentIntent,
        result: toolResult,
      },
      agentResponse,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chat error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
