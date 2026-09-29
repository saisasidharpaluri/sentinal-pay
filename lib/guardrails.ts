import { 
  PaymentRequest, 
  GuardrailEvaluation, 
  GuardrailCheckResult, 
  GuardrailStatus,
  VelocityConfig,
  VelocityStats 
} from './types';

// In-memory ledger of executed transactions for sliding-window velocity checks
interface LedgerEntry {
  timestamp: number; // ms
  amount: number;
  recipient: string;
}

const transactionLedger: LedgerEntry[] = [];
let pendingCount = 0;
let blockedCount = 0;

// Default Velocity & Risk Policy Limits
let config: VelocityConfig = {
  softSingleTxnLimit: 10000, // ₹10,000: amounts above this need Human Approval
  hardSingleTxnLimit: 50000, // ₹50,000: amounts above this are hard blocked
  maxHourlyVolume: 75000,    // ₹75,000 per rolling hour
  maxTransactionsPerMinute: 3, // Max 3 transactions in rolling 60 seconds
  cooldownPeriodSeconds: 5,   // Prevent same-second double-spends
};

// Known adversarial patterns & prompt injection signatures
const INJECTION_PATTERNS: { regex: RegExp; description: string; score: number }[] = [
  {
    regex: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directions|rules|prompts|guardrails)/i,
    description: 'Direct prompt injection / instruction override attempt',
    score: 85,
  },
  {
    regex: /(system|admin|root)\s+(override|bypass|mode|access|escalation)/i,
    description: 'Privilege escalation keyword detected',
    score: 80,
  },
  {
    regex: /bypass\s+(the\s+)?(guardrail|limit|security|check|rule|policy|filter)/i,
    description: 'Explicit security bypass instruction',
    score: 90,
  },
  {
    regex: /transfer\s+(all|entire|max|maximum)\s+(funds|balance|money|credits)/i,
    description: 'Catastrophic fund depletion attempt',
    score: 95,
  },
  {
    regex: /(jailbreak|dan\s+mode|developer\s+mode\s+enabled|unrestricted\s+mode)/i,
    description: 'Adversarial jailbreak terminology',
    score: 85,
  },
  {
    regex: /(darknet|mixer|tornado\s*cash|ransom|untracked|anonymous\s*wallet)/i,
    description: 'High-risk illicit finance destination keyword',
    score: 90,
  },
  {
    regex: /(0x[a-fA-F0-9]{40}|bc1[a-zA-HJ-NP-Z0-9]{25,39})/i,
    description: 'Direct crypto address detected in non-crypto fiat channel',
    score: 75,
  },
  {
    regex: /(<script|drop\s+table|union\s+select|eval\()/i,
    description: 'Adversarial code injection pattern',
    score: 95,
  },
];

// Sanctioned / Blacklisted Recipient names
const BLACKLISTED_RECIPIENTS = [
  'untracked offshore wallet',
  'anonymous crypto mixer',
  'darknet vendor',
  'unverified merchant 99',
  'shadow broker',
];

/**
 * Clean up ledger entries older than 1 hour to maintain lean memory footprint
 */
function pruneOldLedgerEntries(now: number) {
  const oneHourAgo = now - 60 * 60 * 1000;
  while (transactionLedger.length > 0 && transactionLedger[0].timestamp < oneHourAgo) {
    transactionLedger.shift();
  }
}

/**
 * Deterministic Guardrail Evaluation Engine
 */
export function evaluateGuardrails(req: PaymentRequest): GuardrailEvaluation {
  const now = Date.now();
  pruneOldLedgerEntries(now);

  const checks: GuardrailCheckResult[] = [];
  const violations: string[] = [];
  let calculatedRiskScore = 0;

  // ----------------------------------------------------
  // CHECK 1: Prompt Injection & Adversarial Keyword Scan
  // ----------------------------------------------------
  const combinedText = `${req.reason} ${req.recipient} ${req.category}`;
  let injectionDetected = false;
  let maxInjectionScore = 0;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.regex.test(combinedText)) {
      injectionDetected = true;
      maxInjectionScore = Math.max(maxInjectionScore, pattern.score);
      violations.push(`Security Shield: ${pattern.description}`);
    }
  }

  if (injectionDetected) {
    calculatedRiskScore += maxInjectionScore;
    checks.push({
      name: 'Adversarial & Keyword Shield',
      category: 'SECURITY',
      passed: false,
      scoreImpact: maxInjectionScore,
      message: `Prompt injection or illicit keyword match detected in intent context.`,
      details: { violations: violations.slice() }
    });
  } else {
    checks.push({
      name: 'Adversarial & Keyword Shield',
      category: 'SECURITY',
      passed: true,
      scoreImpact: 0,
      message: 'Zero injection or adversarial evasion keywords detected.',
    });
  }

  // ----------------------------------------------------
  // CHECK 2: Recipient Verification & Blacklist
  // ----------------------------------------------------
  const recipientNormalized = req.recipient.trim().toLowerCase();
  const isBlacklisted = BLACKLISTED_RECIPIENTS.some(blocked => 
    recipientNormalized.includes(blocked) || blocked.includes(recipientNormalized)
  );

  if (isBlacklisted) {
    calculatedRiskScore += 80;
    violations.push(`Recipient Blacklist: "${req.recipient}" is flagged as a prohibited destination.`);
    checks.push({
      name: 'Recipient Identity Verification',
      category: 'RECIPIENT',
      passed: false,
      scoreImpact: 80,
      message: `Recipient matched prohibited/sanctioned entities list.`,
    });
  } else if (!req.recipient || req.recipient.length < 2) {
    calculatedRiskScore += 50;
    violations.push('Recipient Identity: Invalid or empty recipient string provided.');
    checks.push({
      name: 'Recipient Identity Verification',
      category: 'RECIPIENT',
      passed: false,
      scoreImpact: 50,
      message: 'Recipient identifier is missing or malformed.',
    });
  } else {
    checks.push({
      name: 'Recipient Identity Verification',
      category: 'RECIPIENT',
      passed: true,
      scoreImpact: 0,
      message: `Recipient "${req.recipient}" passed sanitization and entity validation.`,
    });
  }

  // ----------------------------------------------------
  // CHECK 3: Single Transaction Amount Limits (Hard & Soft)
  // ----------------------------------------------------
  const amount = req.amount;
  let amountPassed = true;

  if (amount <= 0 || isNaN(amount)) {
    calculatedRiskScore += 70;
    violations.push('Amount Validation: Transaction amount must be a positive number.');
    checks.push({
      name: 'Single Transaction Cap',
      category: 'AMOUNT_TIER',
      passed: false,
      scoreImpact: 70,
      message: 'Invalid non-positive transaction value requested.',
    });
    amountPassed = false;
  } else if (amount > config.hardSingleTxnLimit) {
    calculatedRiskScore += 90;
    violations.push(`Hard Cap Exceeded: Requested ₹${amount.toLocaleString()} exceeds hard threshold of ₹${config.hardSingleTxnLimit.toLocaleString()}.`);
    checks.push({
      name: 'Single Transaction Cap',
      category: 'AMOUNT_TIER',
      passed: false,
      scoreImpact: 90,
      message: `Transaction exceeds autonomous hard ceiling of ₹${config.hardSingleTxnLimit.toLocaleString()}. Immediate block.`,
    });
    amountPassed = false;
  } else if (amount > config.softSingleTxnLimit) {
    calculatedRiskScore += 45;
    violations.push(`Soft Tier Flag: Amount ₹${amount.toLocaleString()} exceeds autonomous limit of ₹${config.softSingleTxnLimit.toLocaleString()}. Requires Human-in-the-Loop review.`);
    checks.push({
      name: 'Single Transaction Cap',
      category: 'AMOUNT_TIER',
      passed: false, // Flagged for review
      scoreImpact: 45,
      message: `Amount exceeds autonomous approval tier (₹${config.softSingleTxnLimit.toLocaleString()}). Requires authorized operator sign-off.`,
    });
    amountPassed = false;
  } else {
    // Normal safe transaction amount
    calculatedRiskScore += 5;
    checks.push({
      name: 'Single Transaction Cap',
      category: 'AMOUNT_TIER',
      passed: true,
      scoreImpact: 5,
      message: `Amount ₹${amount.toLocaleString()} is within autonomous threshold (<= ₹${config.softSingleTxnLimit.toLocaleString()}).`,
    });
  }

  // ----------------------------------------------------
  // CHECK 4: Velocity Burst Limits (Frequency in 60s)
  // ----------------------------------------------------
  const oneMinuteAgo = now - 60 * 1000;
  const recent1MinTransactions = transactionLedger.filter(tx => tx.timestamp >= oneMinuteAgo);
  const burstCount = recent1MinTransactions.length;

  if (burstCount >= config.maxTransactionsPerMinute) {
    calculatedRiskScore += 85;
    violations.push(`Velocity Burst Limit: ${burstCount} transactions executed in the last 60 seconds (Limit: ${config.maxTransactionsPerMinute}/min).`);
    checks.push({
      name: 'Velocity Frequency Burst Shield',
      category: 'VELOCITY',
      passed: false,
      scoreImpact: 85,
      message: `Rate ceiling exceeded. Detected ${burstCount} recent transactions within 60s window.`,
      details: { currentBurstCount: burstCount, maxAllowed: config.maxTransactionsPerMinute }
    });
  } else {
    checks.push({
      name: 'Velocity Frequency Burst Shield',
      category: 'VELOCITY',
      passed: true,
      scoreImpact: burstCount * 5,
      message: `Velocity frequency normal: ${burstCount}/${config.maxTransactionsPerMinute} transactions in current 60s window.`,
    });
  }

  // ----------------------------------------------------
  // CHECK 5: Rolling Hourly Volume Limit
  // ----------------------------------------------------
  const hourlySpent = transactionLedger.reduce((sum, tx) => sum + tx.amount, 0);
  const projectedVolume = hourlySpent + (amount > 0 ? amount : 0);

  if (projectedVolume > config.maxHourlyVolume) {
    calculatedRiskScore += 75;
    violations.push(`Hourly Velocity Limit: Rolling spend would reach ₹${projectedVolume.toLocaleString()}, exceeding limit of ₹${config.maxHourlyVolume.toLocaleString()}.`);
    checks.push({
      name: 'Rolling Hourly Volume Limit',
      category: 'VELOCITY',
      passed: false,
      scoreImpact: 75,
      message: `Rolling 1-hour cumulative spend (₹${projectedVolume.toLocaleString()}) violates cap of ₹${config.maxHourlyVolume.toLocaleString()}.`,
    });
  } else {
    checks.push({
      name: 'Rolling Hourly Volume Limit',
      category: 'VELOCITY',
      passed: true,
      scoreImpact: 5,
      message: `Rolling 1-hour volume within bounds: ₹${projectedVolume.toLocaleString()} / ₹${config.maxHourlyVolume.toLocaleString()}.`,
    });
  }

  // ----------------------------------------------------
  // CHECK 6: Payment Intent & Reason Sanitization
  // ----------------------------------------------------
  if (!req.reason || req.reason.trim().length < 5) {
    calculatedRiskScore += 30;
    violations.push('Intent Audit: Payment reason must be descriptive (at least 5 characters).');
    checks.push({
      name: 'Intent Justification Audit',
      category: 'SECURITY',
      passed: false,
      scoreImpact: 30,
      message: 'Agent provided insufficient or empty business justification for transaction.',
    });
  } else {
    checks.push({
      name: 'Intent Justification Audit',
      category: 'SECURITY',
      passed: true,
      scoreImpact: 0,
      message: 'Business reason meets minimum audit clarity requirements.',
    });
  }

  // Clamp Risk Score between 0 and 100
  const finalRiskScore = Math.min(100, Math.max(0, calculatedRiskScore));

  // Determine final status
  let status: GuardrailStatus = 'APPROVED';
  let explanation = 'All deterministic guardrails passed. Transaction cleared for autonomous settlement.';
  let requiresHumanReview = false;

  // Blocker conditions: Injection detected OR Blacklist OR Hard Cap OR Velocity Burst OR Hourly Cap
  if (
    injectionDetected || 
    isBlacklisted || 
    amount > config.hardSingleTxnLimit || 
    burstCount >= config.maxTransactionsPerMinute ||
    projectedVolume > config.maxHourlyVolume ||
    amount <= 0 ||
    isNaN(amount)
  ) {
    status = 'BLOCKED';
    blockedCount++;
    explanation = `Transaction BLOCKED by Sentinel-Pay Guardrail Engine. Violations: ${violations.join('; ')}`;
  } else if (amount > config.softSingleTxnLimit || finalRiskScore >= 40) {
    // Soft Cap / elevated risk -> Human in the loop
    status = 'FLAGGED_FOR_HUMAN_APPROVAL';
    pendingCount++;
    requiresHumanReview = true;
    explanation = `Transaction requires Human-in-the-Loop authorization. Single transaction amount (₹${amount.toLocaleString()}) exceeds the autonomous tier (₹${config.softSingleTxnLimit.toLocaleString()}).`;
  }

  return {
    status,
    riskScore: finalRiskScore,
    checks,
    policyViolations: violations,
    explanation,
    evaluatedAt: new Date().toISOString(),
    requiresHumanReview,
  };
}

/**
 * Record a successfully authorized & settled transaction into the velocity ledger
 */
export function recordSettledTransaction(amount: number, recipient: string, timestamp = Date.now()) {
  transactionLedger.push({
    timestamp,
    amount,
    recipient,
  });
}

/**
 * Get current rolling velocity stats for dashboard gauges
 */
export function getVelocityStats(): VelocityStats {
  const now = Date.now();
  pruneOldLedgerEntries(now);

  const oneMinuteAgo = now - 60 * 1000;
  const recent1Min = transactionLedger.filter(tx => tx.timestamp >= oneMinuteAgo);
  const rolling1Hour = transactionLedger.reduce((sum, tx) => sum + tx.amount, 0);

  return {
    rolling1HourVolume: rolling1Hour,
    rolling1MinuteTxCount: recent1Min.length,
    totalTransactionsToday: transactionLedger.length,
    totalVolumeToday: rolling1Hour,
    activePendingReviewCount: pendingCount,
    blockedCount: blockedCount,
  };
}

/**
 * Reset ledger (used for testing and evaluator resets)
 */
export function resetVelocityLedger() {
  transactionLedger.length = 0;
  pendingCount = 0;
  blockedCount = 0;
}

export function decrementPendingCount() {
  if (pendingCount > 0) pendingCount--;
}

export function getVelocityConfig(): VelocityConfig {
  return { ...config };
}

export function updateVelocityConfig(newConfig: Partial<VelocityConfig>): VelocityConfig {
  config = { ...config, ...newConfig };
  return { ...config };
}
