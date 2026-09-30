# Sentinel Pay demo walkthrough

Suggested recording length: about 3 minutes. Start from a freshly reset demo so the metrics and ledger tell a clear story.

## 0:00–0:25 — Introduce the problem

> AI agents can initiate spending, but a prompt is not a spending policy. Sentinel Pay is a control layer that extracts a payment intent, checks it against deterministic rules, and records whether it was approved, held for a person, or blocked. This demo uses simulated payment rails only.

Open the landing page, show the product explanation and simulated/test disclosure, then launch the operator console.

## 0:25–1:05 — Show AI intent extraction and a safe request

If the console reports **AI parsed**, submit:

> Please renew our AWS S3 backup storage for ₹1,850 this week to keep compliance logs available.

Expand **Decision trace**. Point out the selected source and model, the extracted payment fields, the policy checks, and the resulting decision. Explain that the model extracts intent; `executeAgentPayment` and the deterministic guardrails decide the outcome. If it reports **Fallback parser**, explain that this deployment currently has no AI Gateway access and the app labels that fallback rather than claiming an LLM ran.

## 1:05–1:45 — Show human authority

Run the **Human review** scenario. Show that the request appears in the review queue and is not settled while it is pending. Approve it, then point to the operator decision and simulated test settlement in the activity and ledger.

## 1:45–2:25 — Show a handled failure

Run **Adversarial request**. Show the failed security check, block outcome, and policy explanation. The model does not have a way to override the deterministic checks, and a blocked request creates no simulated settlement.

If time permits, run **Velocity burst** and show that the burst cap blocks the excess request.

## 2:25–3:00 — Explain limits and what you learned

> This is a prototype, not a production payment system. Orders and settlement are simulated; state is in memory; and operator endpoints are not authenticated. A production version would need durable, shared policy state, authenticated and auditable approvals, idempotency, monitoring, and a real payment-provider integration. I kept the model outside the authorization boundary so that uncertain AI output cannot approve a payment.

End with the repository README and architecture diagram. Avoid showing API keys, private account details, or claiming that Razorpay processed a payment.
