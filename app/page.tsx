import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronRight,
  CircleDollarSign,
  Fingerprint,
  Gauge,
  LockKeyhole,
  Radar,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Zap,
} from 'lucide-react';

const controls = [
  { icon: ShieldX, title: 'Adversarial intent', value: 'Intercepted before execution', tone: 'rose' },
  { icon: Gauge, title: 'Spend velocity', value: 'Rolling caps, every request', tone: 'blue' },
  { icon: Fingerprint, title: 'Human authority', value: 'Review before release', tone: 'amber' },
];

const flow = [
  { number: '01', title: 'Agent requests', description: 'A payment intent arrives with a recipient, amount, and business reason.' },
  { number: '02', title: 'Policy evaluates', description: 'Deterministic controls inspect identity, intent, amount, and velocity.' },
  { number: '03', title: 'Payment is controlled', description: 'Safe requests settle in the test rail. Exceptions wait for a human or are blocked.' },
];

export default function HomePage() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link className="brand-lockup" href="/" aria-label="Sentinel Pay home">
          <span className="brand-mark"><Zap size={17} fill="currentColor" /></span>
          <span className="brand-name">sentinel<span>pay</span></span>
        </Link>
        <nav className="landing-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#controls">Controls</a>
          <span className="test-rail-label"><span /> Razorpay test rails</span>
          <Link className="button button-dark button-small" href="/console">Launch live demo <ArrowRight size={15} /></Link>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> FINANCIAL CONTROL FOR AUTONOMOUS AGENTS</div>
          <h1>Give agents the freedom to act.<br /><em>Keep every payment</em> in check.</h1>
          <p className="hero-lede">Sentinel Pay is a deterministic control layer between AI agents and payment rails. Every request is evaluated against clear policies before a rupee moves.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/console">Explore the live demo <ArrowRight size={16} /></Link>
            <a className="text-link" href="#how-it-works">See how it works <ChevronRight size={15} /></a>
          </div>
          <div className="hero-proof"><span className="proof-icon"><ShieldCheck size={16} /></span><span>Policy enforced outside the model</span><i /> <span>Human approval for exceptions</span></div>
        </div>

        <div className="hero-visual" aria-label="Illustration of a payment moving through Sentinel Pay controls">
          <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
          <div className="visual-caption"><span>REQUEST PIPELINE</span><span className="caption-live"><i /> ACTIVE</span></div>
          <div className="mini-request">
            <div className="request-avatar"><CircleDollarSign size={20} /></div>
            <div className="request-content"><span>AGENT PAYMENT REQUEST</span><strong>₹1,850.00</strong><small>AWS · Cloud storage</small></div>
            <span className="request-arrow"><ArrowDownRight size={17} /></span>
          </div>
          <div className="pipeline-line"><span /></div>
          <div className="policy-stack">
            <div className="policy-row"><span className="policy-check"><Check size={12} /></span><span>Identity verified</span><small>PASS</small></div>
            <div className="policy-row"><span className="policy-check"><Check size={12} /></span><span>Spend within policy</span><small>PASS</small></div>
            <div className="policy-row"><span className="policy-check"><Check size={12} /></span><span>Intent is low risk</span><small>PASS</small></div>
          </div>
          <div className="pipeline-line pipeline-line-last"><span /></div>
          <div className="settlement-card"><span className="settlement-icon"><Check size={15} /></span><div><strong>Approved for settlement</strong><small>Razorpay test order created</small></div><span className="settlement-tag">SAFE</span></div>
          <div className="visual-footnote"><LockKeyhole size={12} /> Deterministic policy. Auditable outcome.</div>
          <div className="floating-stat"><span className="floating-stat-icon"><Radar size={17} /></span><span><strong>6</strong><small>policy checks</small></span><span className="stat-status">ALL CLEAR</span></div>
        </div>
        <div className="hero-bottom-rule"><span>BUILT FOR AGENTIC COMMERCE</span><span>POLICY FIRST <ArrowRight size={13} /> PAYMENT SECOND</span></div>
      </section>

      <section id="controls" className="controls-section section-wrap">
        <div className="section-heading"><div><span className="section-kicker">CONTROL WITHOUT GUESSWORK</span><h2>Financial guardrails,<br />built for autonomous systems.</h2></div><p>Models can interpret intent. They shouldn’t be trusted to enforce spending limits. Sentinel Pay applies explicit rules at the payment boundary.</p></div>
        <div className="control-grid">
          {controls.map(({ icon: Icon, title, value, tone }, index) => <article className={`control-card ${tone}`} key={title}><span className="control-icon"><Icon size={19} /></span><span className="control-index">0{index + 1}</span><h3>{title}</h3><p>{value}</p><span className="card-rule" /></article>)}
        </div>
      </section>

      <section id="how-it-works" className="flow-section">
        <div className="section-wrap flow-inner">
          <div className="flow-intro"><span className="section-kicker">A SIMPLE, AUDITABLE PATH</span><h2>From agent intent<br />to a controlled outcome.</h2><p>Every decision leaves a trace. Every exception has an owner.</p><Link className="text-link" href="/console">Walk through a scenario <ArrowRight size={15} /></Link></div>
          <div className="flow-list">{flow.map((step, index) => <article className="flow-step" key={step.number}><span className="flow-number">{step.number}</span><div><h3>{step.title}</h3><p>{step.description}</p></div>{index < flow.length - 1 && <span className="flow-connector" />}</article>)}</div>
        </div>
      </section>

      <section className="guardrail-band section-wrap">
        <div className="guardrail-title"><span className="section-kicker">THE POLICY LAYER</span><h2>Clear limits.<br />No prompt override.</h2><p>Six checks, evaluated before the payment rail is called.</p></div>
        <div className="limit-list">
          <div><span>Autonomous single payment</span><strong>≤ ₹10,000</strong><small>Higher amounts enter human review</small></div>
          <div><span>Hard transaction ceiling</span><strong>₹50,000</strong><small>Above the ceiling is blocked</small></div>
          <div><span>Rolling hourly budget</span><strong>₹75,000</strong><small>Sliding spend window</small></div>
          <div><span>Transaction velocity</span><strong>3 / minute</strong><small>Burst requests are intercepted</small></div>
        </div>
      </section>

      <section className="demo-cta section-wrap">
        <div className="cta-spark"><Sparkles size={20} /></div><div><span className="section-kicker">SEE THE GUARDRAILS IN ACTION</span><h2>One console. Four real scenarios.</h2><p>Try an approved payment, a human-review hold, a velocity burst, or a malicious request.</p></div><Link className="button button-primary" href="/console">Launch interactive demo <ArrowRight size={16} /></Link>
      </section>

      <footer className="landing-footer"><Link className="brand-lockup" href="/"><span className="brand-mark"><Zap size={15} fill="currentColor" /></span><span className="brand-name">sentinel<span>pay</span></span></Link><p>Autonomous intent. Deterministic control.</p><span className="footer-disclosure">Demo uses simulated Razorpay test rails. No live payments are processed.</span></footer>
    </main>
  );
}
