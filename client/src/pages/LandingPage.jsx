import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToastStore } from '../store/toastStore';
import { authService } from '../services/authService';
import { ToastContainer } from '../components/ui';

// ── SECTION EYEBROW ──
function Eyebrow({ text }) {
  return (
    <div className="inline-flex items-center gap-3 mb-4">
      <span className="w-5 h-px bg-gold block" />
      <span className="font-ui text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">{text}</span>
    </div>
  );
}

// ── NAVBAR ──
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-12 h-16 bg-cream/92 backdrop-blur-xl border-b border-dark/10 transition-shadow duration-300 ${scrolled ? 'shadow-md' : ''}`}>
      <div className="font-ui text-[15px] font-medium text-dark tracking-[0.01em]">
        Forge <span className="text-gold">Quantum</span> Solution
      </div>

      <div className="hidden md:flex gap-9">
        {[['Product', 'features'], ['Features', 'features'], ['How It Works', 'how'], ['Compliance', 'compliance'], ['Roles', 'roles']].map(([label, id]) => (
          <button key={label} onClick={() => scrollTo(id)}
            className="font-ui text-[12px] font-medium uppercase tracking-[0.1em] text-mid hover:text-dark transition-colors">
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-6">
        <Link to="/signin" className="font-ui text-[12px] font-semibold uppercase tracking-[0.12em] text-dark hover:text-gold transition-colors">
          Sign In
        </Link>
        <button onClick={() => scrollTo('cta')}
          className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] bg-gold hover:bg-gold2 text-white px-6 py-3 rounded-[3px] transition-all">
          Get Started
        </button>
        <button className="md:hidden text-mid" onClick={() => setMenuOpen(v => !v)}>☰</button>
      </div>

      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-cream border-b border-dark/10 p-6 flex flex-col gap-4 md:hidden">
          {[['Product', 'features'], ['Features', 'features'], ['How It Works', 'how'], ['Compliance', 'compliance'], ['Roles', 'roles']].map(([label, id]) => (
            <button key={label} onClick={() => scrollTo(id)}
              className="font-ui text-sm font-medium text-mid hover:text-gold text-left transition-colors">
              {label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

// ── HERO MINI DASHBOARD CARD ──
function HeroDashboardCard() {
  const bars = [40, 65, 55, 80, 70, 90, 75, 95];
  return (
    <div className="relative bg-white border border-dark/10 rounded-[10px] p-6 shadow-[0_8px_40px_rgba(26,26,20,0.10)]">
      <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.16em] text-muted mb-5">
        Supply Planner View
      </p>
      {/* Mini KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[['94.3%', 'Forecast Acc.'], ['₹4.2Cr', 'Inv. Value'], ['1,284', 'Auto POs']].map(([v, l]) => (
          <div key={l} className="bg-cream rounded-[6px] px-3 py-3.5">
            <div className="font-display text-2xl font-bold text-gold leading-none">{v}</div>
            <div className="font-ui text-[10px] text-muted mt-1">{l}</div>
          </div>
        ))}
      </div>
      {/* Mini bar chart */}
      <div className="flex items-end gap-1 h-14 mb-5">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-t-sm bg-gold/20"
            style={{ height: `${h}%`, backgroundColor: i === bars.length - 1 ? '#b8922a' : undefined, opacity: 0.4 + (i / bars.length) * 0.6 }}
          />
        ))}
      </div>
      {/* Mini SKU table */}
      <div className="border-t border-dark/8 pt-3.5">
        <div className="grid grid-cols-3 font-ui text-[10px] font-semibold uppercase tracking-[0.06em] text-muted pb-2">
          <span>SKU</span><span>Days</span><span>Status</span>
        </div>
        {[
          ['Paracetamol', '34d', 'HEALTHY', 'ok'],
          ['Amoxicillin', '14d', 'REORDER', 'warn'],
          ['Ibuprofen', '5d', 'CRITICAL', 'risk'],
        ].map(([name, days, status, type]) => (
          <div key={name} className="grid grid-cols-3 font-ui text-[11px] py-1.5 border-b border-dark/5 text-mid">
            <span>{name}</span>
            <span>{days}</span>
            <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-semibold ${
              type === 'ok' ? 'bg-green-light text-green' :
              type === 'warn' ? 'bg-amber-light text-[#b45309]' :
              'bg-danger-light text-danger'
            }`}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HERO ──
function Hero() {
  const navigate = useNavigate();
  return (
    <section className="min-h-screen flex items-center pt-24 pb-16 px-12 bg-cream relative overflow-hidden">
      {/* Texture */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(184,146,42,0.05) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(184,146,42,0.04) 0%, transparent 40%)' }} />
      {/* Grid lines right side */}
      <div className="absolute right-0 top-0 bottom-0 w-[55%] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(26,26,20,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(26,26,20,0.04) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <div className="relative max-w-[1280px] mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div>
          <div className="inline-flex items-center gap-3.5 border border-dark/10 px-4 py-2 rounded-sm mb-8">
            <span className="w-6 h-px bg-gold block" />
            <span className="font-ui text-[10px] font-semibold uppercase tracking-[0.2em] text-mid">AI-Powered Supply Chain Optimisation</span>
          </div>

          <h1 className="font-display text-[68px] font-black leading-[1.02] tracking-[-1px] text-dark mb-2">
            Unified Planning.
          </h1>
          <h1 className="font-display text-[72px] font-bold italic leading-[1.02] tracking-[-1px] text-gold mb-6">
            Intelligent Control.
          </h1>

          <p className="font-body text-[19px] text-mid leading-[1.75] mb-10 max-w-[520px]">
            Quantum Optimizer unifies demand forecasting, autonomous replenishment, and compliance
            across your entire supply chain — purpose-built for Pharma, F&B, and FMCG enterprises.
          </p>

          <div className="flex gap-4 flex-wrap items-center">
            <Link to="/signin"
              className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] bg-gold hover:bg-gold2 text-white px-8 py-4 rounded-[3px] transition-all">
              Sign In to Platform
            </Link>
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] bg-transparent text-dark border-[1.5px] border-dark hover:border-gold hover:text-gold px-8 py-4 rounded-[3px] transition-all">
              Explore Product
            </button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 mt-14 border-t border-l border-dark/10">
            {[
              ['12+', 'AI Planning Modules'],
              ['100%', 'Digital Audit Trail'],
              ['6', 'Role-based Access Levels'],
              ['21 CFR', 'Part 11 Ready'],
            ].map(([v, l]) => (
              <div key={l} className="px-5 py-6 border-r border-b border-dark/10">
                <div className="font-display text-[36px] font-bold text-gold leading-none mb-1.5">{v}</div>
                <div className="font-ui text-[11px] text-muted tracking-[0.05em]">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Floating cards */}
        <div className="hidden md:flex relative items-center justify-center min-h-[500px]">
          <HeroDashboardCard />
          {/* Demand Forecast float card */}
          <div className="absolute top-5 right-0 w-[240px] bg-white border border-dark/10 rounded-[10px] p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center text-[10px]">📈</div>
              <span className="font-ui text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Demand Forecast</span>
            </div>
            <div className="font-display text-[40px] font-bold text-green leading-none mb-1.5">+38%</div>
            <div className="font-ui text-[12px] text-muted mb-3">vs baseline projection</div>
            <div className="h-1.5 bg-cream3 rounded-full overflow-hidden">
              <div className="h-full bg-green rounded-full" style={{ width: '78%' }} />
            </div>
            <div className="font-ui text-[11px] text-muted mt-2">78% confidence</div>
          </div>
          {/* Cert Health float card */}
          <div className="absolute bottom-20 -left-5 w-[220px] bg-white border border-dark/10 rounded-[10px] p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-blue-light flex items-center justify-center text-[10px]">🛡</div>
              <span className="font-ui text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Cert Health</span>
            </div>
            <div className="font-display text-[40px] font-bold text-blue leading-none mb-1.5">96%</div>
            <div className="font-ui text-[12px] text-muted mb-3">compliance score</div>
            <div className="flex gap-1.5 flex-wrap mt-2">
              {['GMP', 'FSSAI', '21 CFR', 'ISO'].map(t => (
                <span key={t} className="px-2 py-0.5 bg-blue-light text-blue font-ui text-[10px] font-semibold rounded-sm">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── KPI STRIP ──
function KPIStrip() {
  return (
    <div className="bg-cream2 border-y border-dark/10 py-0">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 border-l border-dark/10">
          {[
            ['↑50%', 'Forecast Accuracy', 'self-learning AI models'],
            ['↓40%', 'Inventory Cost', 'through right-sizing'],
            ['↓55%', 'Stockout Events', 'via predictive replenishment'],
            ['↓35%', 'Product Waste', 'expiry-aware AI planning'],
          ].map(([val, label, sub]) => (
            <div key={label} className="px-9 py-10 border-r border-b border-dark/10">
              <div className="font-display text-[48px] font-black text-gold leading-none mb-2 tracking-[-1px]">{val}</div>
              <div className="font-ui text-[12px] text-mid tracking-[0.04em]">{label}</div>
              <div className="font-ui text-[11px] text-muted2 mt-1">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── FEATURES ──
const FEATURES = [
  ['01', 'Self-Learning AI Forecasting', 'Ensemble models (LSTM, XGBoost, Prophet) continuously retrain on your POS, ERP, and external signals for unmatched accuracy.'],
  ['02', 'Autonomous Replenishment', 'AI-generated purchase orders auto-approved within your defined thresholds — full audit trail for every decision.'],
  ['03', 'Real-Time Demand Sensing', 'Ingest live POS data, weather, promotions, and market signals to sense demand shifts before they become shortfalls.'],
  ['04', 'Expiry & Shelf-Life AI', 'Intelligent batch tracking with days-to-expiry alerts, redistribution recommendations, and waste reduction planning.'],
  ['05', 'Scenario Planning Studio', 'Model promotions, supply disruptions, new product launches, and seasonal peaks — compare outcomes before committing.'],
  ['06', 'Universal ERP Integration', 'Native connectors for SAP, Oracle, Microsoft Dynamics, Salesforce, and any REST/SOAP API via our integration layer.'],
];

function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-12 bg-cream2">
      <div className="max-w-[1280px] mx-auto">
        <Eyebrow text="Platform Capabilities" />
        <h2 className="font-display text-[46px] font-bold text-dark leading-tight tracking-[-0.5px] mb-4">
          Everything your supply chain <em className="italic text-gold">demands.</em>
        </h2>
        <p className="font-body text-[19px] text-mid leading-[1.75] max-w-[580px] mb-14">
          Six integrated modules working as one intelligent system — from raw signal ingestion to autonomous execution.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 border border-dark/10 rounded-[10px] overflow-hidden divide-x divide-y divide-dark/10">
          {FEATURES.map(([num, title, desc]) => (
            <div key={num} className="bg-white hover:bg-cream p-9 transition-colors">
              <span className="font-display text-[40px] font-bold text-cream3 leading-none mb-5 block">{num}</span>
              <h3 className="font-display text-[21px] font-bold text-dark mb-3 tracking-[-0.2px]">{title}</h3>
              <p className="font-body text-[17px] text-mid leading-[1.7]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── HOW IT WORKS ──
const STEPS = [
  {
    num: '01', title: 'Data Ingestion',
    desc: 'Connect your ERP, POS, WMS, and external data sources via our pre-built connectors or REST API. Data is normalised, validated, and enriched in real time.',
    visual: (
      <div className="space-y-3">
        {[['SAP ERP', '✓ Connected', 'ok'], ['Oracle WMS', '✓ Connected', 'ok'], ['POS System', '⟳ Syncing', 'warn'], ['Kafka Stream', '✓ Live', 'ok']].map(([n, s, t]) => (
          <div key={n} className="flex items-center justify-between p-3 bg-cream rounded-[6px]">
            <span className="font-ui text-sm text-dark font-medium">{n}</span>
            <span className={`font-ui text-[11px] font-semibold px-2.5 py-1 rounded-sm ${t === 'ok' ? 'bg-green-light text-green' : 'bg-amber-light text-[#b45309]'}`}>{s}</span>
          </div>
        ))}
      </div>
    )
  },
  {
    num: '02', title: 'AI Demand Modelling',
    desc: 'Ensemble models automatically weight LSTM, XGBoost, and Prophet outputs per SKU based on historical accuracy — producing confidence-banded forecasts at every horizon.',
    visual: (
      <div className="space-y-3">
        {[['LSTM Neural Network', 94.3], ['XGBoost Gradient', 91.8], ['Prophet Seasonal', 89.3], ['Ensemble (weighted)', 95.1]].map(([m, acc]) => (
          <div key={m}>
            <div className="flex justify-between mb-1">
              <span className="font-ui text-xs text-mid">{m}</span>
              <span className="font-ui text-xs font-semibold text-gold">{acc}%</span>
            </div>
            <div className="h-2 bg-cream3 rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${acc}%` }} />
            </div>
          </div>
        ))}
      </div>
    )
  },
  {
    num: '03', title: 'Intelligent Alerting',
    desc: 'Rule-based and ML-powered alerts notify the right persona at the right time — stockout risks, expiry warnings, supplier delays, and AI plan readiness.',
    visual: (
      <div className="space-y-2.5">
        {[
          ['CRITICAL', 'Ibuprofen stockout in 5 days', 'risk'],
          ['WARNING', 'Batch #2241 expires in 14 days', 'warn'],
          ['INFO', 'AI plan ready — 12 SKUs', 'ok'],
        ].map(([s, m, t]) => (
          <div key={m} className={`flex items-start gap-3 p-3 rounded-[6px] border-l-2 ${t === 'risk' ? 'bg-danger-light border-danger' : t === 'warn' ? 'bg-amber-light border-[#b45309]' : 'bg-green-light border-green'}`}>
            <span className={`font-ui text-[10px] font-bold px-1.5 py-0.5 rounded ${t === 'risk' ? 'bg-danger text-white' : t === 'warn' ? 'bg-[#b45309] text-white' : 'bg-green text-white'}`}>{s}</span>
            <span className="font-ui text-xs text-dark">{m}</span>
          </div>
        ))}
      </div>
    )
  },
  {
    num: '04', title: 'Autonomous Execution',
    desc: 'Within your configured approval thresholds, Quantum Optimizer auto-generates and approves purchase orders, writes back to SAP/Oracle, and logs every action.',
    visual: (
      <div className="grid grid-cols-2 gap-3">
        {[['1,284', 'Auto POs Generated'], ['94%', 'Auto-Approval Rate'], ['₹2.1Cr', 'Value Auto-Processed'], ['< 2min', 'Avg Execution Time']].map(([v, l]) => (
          <div key={l} className="bg-cream rounded-[6px] p-4 text-center">
            <div className="font-display text-2xl font-bold text-gold">{v}</div>
            <div className="font-ui text-[10px] text-muted mt-1">{l}</div>
          </div>
        ))}
      </div>
    )
  },
  {
    num: '05', title: 'Continuous Learning',
    desc: 'Every override, correction, and outcome feeds back into the models. Accuracy compounds over time, and the system self-calibrates to your business patterns.',
    visual: (
      <div className="space-y-3">
        <div className="flex justify-between font-ui text-xs text-muted mb-1">
          <span>Model Accuracy Over Time</span><span className="text-gold font-semibold">↑ +6.2%</span>
        </div>
        <div className="flex items-end gap-1.5 h-20">
          {[72, 76, 79, 82, 84, 86, 88, 90, 92, 94].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm"
              style={{ height: `${h}%`, backgroundColor: i === 9 ? '#b8922a' : '#e8dfd4' }} />
          ))}
        </div>
        <div className="flex justify-between font-ui text-[10px] text-muted2">
          <span>Month 1</span><span>Now</span>
        </div>
      </div>
    )
  },
];

function HowItWorksSection() {
  const [active, setActive] = useState(0);
  return (
    <section id="how" className="py-24 px-12 bg-cream">
      <div className="max-w-[1280px] mx-auto">
        <Eyebrow text="How It Works" />
        <h2 className="font-display text-[46px] font-bold text-dark leading-tight tracking-[-0.5px] mb-4">
          From raw data to <em className="italic text-gold">autonomous action.</em>
        </h2>
        <p className="font-body text-[19px] text-mid leading-[1.75] max-w-[580px] mb-14">
          Five integrated stages that transform fragmented supply chain signals into intelligent, auditable decisions.
        </p>
        <div className="grid md:grid-cols-2 gap-20 items-start">
          {/* Steps */}
          <div>
            {STEPS.map((step, i) => (
              <div key={step.num}
                onClick={() => setActive(i)}
                className={`flex gap-6 py-7 border-b border-dark/10 cursor-pointer transition-all last:border-0 ${i === 0 ? 'pt-0' : ''}`}>
                <span className={`font-display text-[13px] font-bold shrink-0 pt-0.5 min-w-[24px] transition-colors ${i === active ? 'text-gold' : 'text-muted2'}`}>
                  {step.num}
                </span>
                <div>
                  <h3 className={`font-display text-[20px] font-bold mb-2 tracking-[-0.2px] transition-colors ${i === active ? 'text-gold' : 'text-dark'}`}>
                    {step.title}
                  </h3>
                  {i === active && (
                    <p className="font-body text-[16px] text-mid leading-[1.7]">{step.desc}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Visual panel */}
          <div className="sticky top-28">
            <div className="bg-white border border-dark/10 rounded-[10px] p-8 shadow-[0_4px_24px_rgba(26,26,20,0.06)]">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-gold block" />
                <span className="font-ui text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  {STEPS[active].num} — {STEPS[active].title}
                </span>
              </div>
              {STEPS[active].visual}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── COMPLIANCE ──
const COMPLIANCE_BADGES = [
  ['21 CFR Part 11', 'FDA Electronic Records', 'Full audit trail for all electronic records and signatures'],
  ['GMP', 'Good Manufacturing Practice', 'End-to-end process controls meeting GMP documentation standards'],
  ['ISO 13485', 'Medical Devices QMS', 'Quality management system integration for medical device supply chains'],
  ['FSSAI', 'Food Safety Standards', 'India Food Safety and Standards Authority compliance for F&B'],
  ['HACCP', 'Hazard Analysis', 'Critical control point monitoring integrated with inventory tracking'],
  ['GDPR', 'Data Protection', 'EU data residency, right-to-erasure, and consent management built in'],
];

function ComplianceSection() {
  return (
    <section id="compliance" className="py-24 px-12 bg-white">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <Eyebrow text="Compliance & Security" />
            <h2 className="font-display text-[46px] font-bold text-dark leading-tight tracking-[-0.5px] mb-4">
              Built for <em className="italic text-gold">regulated industries.</em>
            </h2>
            <p className="font-body text-[19px] text-mid leading-[1.75] mb-10">
              Every action is logged, every decision is auditable, and every deployment meets your industry's regulatory framework out of the box.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {COMPLIANCE_BADGES.map(([badge, title, desc]) => (
                <div key={badge} className="bg-white border border-dark/10 rounded-[10px] p-6 hover:shadow-md transition-shadow">
                  <span className="inline-block px-3 py-1.5 bg-amber-light text-gold font-ui text-[11px] font-bold uppercase tracking-[0.12em] rounded-sm mb-3">{badge}</span>
                  <h4 className="font-display text-[17px] font-bold text-dark mb-1.5">{title}</h4>
                  <p className="font-body text-[14px] text-mid leading-[1.6]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            {/* Auth flow visual */}
            <div className="bg-cream2 border border-dark/10 rounded-[10px] p-8 mb-6">
              <h3 className="font-display text-lg font-bold text-dark mb-6">Authentication Flow</h3>
              <div className="space-y-3">
                {[
                  ['1', 'SSO / SAML 2.0', 'Enterprise identity provider integration'],
                  ['2', 'MFA Verification', 'TOTP or hardware key second factor'],
                  ['3', 'RBAC JWT', 'Role-scoped access token issued'],
                  ['4', 'Audit Log', 'All access events written to immutable log'],
                ].map(([n, title, desc]) => (
                  <div key={n} className="flex items-center gap-4 bg-white rounded-[8px] p-4 border border-dark/8">
                    <span className="w-7 h-7 rounded-full bg-gold text-white font-ui text-xs font-bold flex items-center justify-center shrink-0">{n}</span>
                    <div>
                      <p className="font-ui text-sm font-semibold text-dark">{title}</p>
                      <p className="font-ui text-xs text-muted">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Security tiles */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['🔐', 'AES-256 Encryption', 'Data at rest and in transit'],
                ['🔑', 'SSO / SAML 2.0', 'Enterprise IdP integration'],
                ['📋', 'Full Audit Trail', '21 CFR Part 11 compliant'],
                ['🌍', 'Data Residency', 'Regional deployment options'],
              ].map(([icon, title, desc]) => (
                <div key={title} className="bg-cream rounded-[8px] p-4 border border-dark/8">
                  <span className="text-xl mb-2 block">{icon}</span>
                  <p className="font-ui text-sm font-semibold text-dark">{title}</p>
                  <p className="font-ui text-xs text-muted mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── ROLES ──
const ROLES_DATA = [
  { icon: '🏪', title: 'Retailer', dept: 'Store Operations', desc: 'View store-level inventory, receive reorder alerts, and approve auto-replenishment within allocated budgets.', perms: ['View own store inventory', 'Receive stockout alerts', 'Approve replenishment POs'] },
  { icon: '🚚', title: 'Distributor Manager', dept: 'Distribution & Logistics', desc: 'Manage assigned distribution zones, coordinate multi-store replenishment, and track supplier SLAs.', perms: ['Multi-store inventory view', 'Supplier performance dashboard', 'Zone-level demand reports'] },
  { icon: '📊', title: 'Supply Planner', dept: 'Supply Chain Planning', desc: 'Full AI forecast access with override capability, scenario planning, and cross-network replenishment control.', perms: ['AI forecast override', 'Scenario Planning Studio', 'Cross-network view'] },
  { icon: '🏭', title: 'Production Manager', dept: 'Manufacturing', desc: 'Production schedule optimisation based on AI demand signals, raw material planning, and capacity management.', perms: ['Production scheduling', 'Raw material planning', 'Capacity dashboards'] },
  { icon: '💰', title: 'Finance', dept: 'Financial Planning & Analysis', desc: 'Inventory valuation, working capital analytics, and budget-to-actuals tracking with full audit access.', perms: ['Inventory valuation reports', 'Working capital dashboards', 'Budget vs. actuals'] },
  { icon: '⚙️', title: 'Super Admin', dept: 'Platform Administration', desc: 'Full tenant configuration, user management, SSO setup, AI model management, and complete audit log access.', perms: ['User & role management', 'SSO / MFA configuration', 'AI model management'] },
];

function RolesSection() {
  return (
    <section id="roles" className="py-24 px-12 bg-dark">
      <div className="max-w-[1280px] mx-auto">
        <Eyebrow text="Role-Based Access" />
        <h2 className="font-display text-[46px] font-bold text-white leading-tight tracking-[-0.5px] mb-4">
          Every stakeholder, <em className="italic text-gold">perfectly equipped.</em>
        </h2>
        <p className="font-body text-[19px] leading-[1.75] mb-14" style={{ color: 'rgba(245,242,236,0.6)' }}>
          Six role-based personas with precisely scoped access — ensuring the right data reaches the right person, always.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {ROLES_DATA.map((role) => (
            <div key={role.title}
              className="bg-white/4 border border-white/8 rounded-[10px] p-7 hover:bg-white/7 hover:border-gold/40 transition-all cursor-pointer"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="w-11 h-11 rounded-[6px] flex items-center justify-center text-xl mb-4 border"
                style={{ background: 'rgba(184,146,42,0.12)', borderColor: 'rgba(184,146,42,0.2)' }}>
                {role.icon}
              </div>
              <h3 className="font-display text-[20px] font-bold text-white mb-2">{role.title}</h3>
              <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.16em] text-gold mb-3.5">{role.dept}</p>
              <p className="font-body text-[16px] leading-[1.7] mb-4" style={{ color: 'rgba(245,242,236,0.55)' }}>{role.desc}</p>
              <div className="flex flex-col gap-1.5">
                {role.perms.map((p) => (
                  <div key={p} className="flex items-center gap-2 font-ui text-[12px]" style={{ color: 'rgba(245,242,236,0.5)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-gold block shrink-0" />
                    {p}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── INDUSTRIES ──
const INDUSTRIES = [
  {
    icon: '💊', title: 'Pharmaceutical', desc: 'End-to-end cold chain management, batch traceability, and 21 CFR Part 11 compliant audit trails for drug supply networks.',
    features: ['Batch & serialisation tracking', 'Cold chain temperature alerts', 'Regulatory submission reports', 'Drug shortage prediction'],
  },
  {
    icon: '🍽', title: 'Food & Beverage', desc: 'FSSAI-compliant expiry management, seasonal demand modelling, and supplier diversification for perishable supply chains.',
    features: ['FSSAI compliance management', 'Perishable demand forecasting', 'Seasonal uplift modelling', 'Supplier scorecard'],
  },
  {
    icon: '🛒', title: 'FMCG', desc: 'Promotional uplift modelling, multi-channel demand sensing, and retailer collaboration portals for fast-moving consumer goods.',
    features: ['Promo uplift simulation', 'Multi-channel demand signals', 'Retailer collaboration hub', 'SKU rationalisation AI'],
  },
];

function IndustriesSection() {
  return (
    <section className="py-24 px-12 bg-cream2">
      <div className="max-w-[1280px] mx-auto">
        <Eyebrow text="Industry Solutions" />
        <h2 className="font-display text-[46px] font-bold text-dark leading-tight tracking-[-0.5px] mb-4">
          Purpose-built for <em className="italic text-gold">your industry.</em>
        </h2>
        <p className="font-body text-[19px] text-mid leading-[1.75] max-w-[580px] mb-14">
          Pre-configured compliance frameworks, industry-specific AI models, and domain workflows out of the box.
        </p>
        <div className="grid md:grid-cols-3 gap-5">
          {INDUSTRIES.map((ind) => (
            <div key={ind.title} className="border border-dark/10 rounded-[10px] overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-white p-7">
                <span className="text-[32px] mb-3.5 block">{ind.icon}</span>
                <h3 className="font-display text-[22px] font-bold text-dark mb-2.5">{ind.title}</h3>
                <p className="font-body text-[16px] text-mid leading-[1.7]">{ind.desc}</p>
              </div>
              <div className="bg-cream2 p-7 border-t border-dark/10 space-y-2">
                {ind.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 font-ui text-[12px] text-mid">
                    <span className="text-gold text-[11px]">→</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── INTEGRATIONS ──
const INTEGRATIONS = [
  ['🟡', 'SAP', 'ERP'], ['🔵', 'Oracle', 'ERP'], ['🟦', 'MS Dynamics', 'ERP'], ['☁️', 'Salesforce', 'CRM'],
  ['⚡', 'Kafka', 'Streaming'], ['🟠', 'AWS', 'Cloud'], ['❄️', 'Snowflake', 'Data Warehouse'],
  ['🔗', 'MuleSoft', 'iPaaS'], ['🌐', 'Google Cloud', 'Cloud'], ['🔷', 'Azure', 'Cloud'],
];

function IntegrationsSection() {
  return (
    <section className="py-24 px-12 bg-cream">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-14">
          <Eyebrow text="Integrations" />
          <h2 className="font-display text-[46px] font-bold text-dark leading-tight tracking-[-0.5px] mb-4">
            Works with your <em className="italic text-gold">existing stack.</em>
          </h2>
          <p className="font-body text-[19px] text-mid leading-[1.75] max-w-[560px] mx-auto">
            API-first architecture connects to any ERP, WMS, data warehouse, or streaming platform you already use.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
          {INTEGRATIONS.map(([icon, name, type]) => (
            <div key={name} className="bg-white border border-dark/10 rounded-[6px] p-4 text-center hover:border-gold/30 transition-colors">
              <span className="text-2xl mb-2 block">{icon}</span>
              <p className="font-ui text-[12px] font-medium text-dark">{name}</p>
              <p className="font-ui text-[10px] text-muted">{type}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <div className="inline-flex items-center gap-3 bg-amber-light border border-gold/20 rounded-full px-6 py-2.5">
            <span className="text-gold text-sm">⚡</span>
            <span className="font-ui text-[12px] font-semibold text-dark">API-first architecture — connect any system via REST, GraphQL, or Webhooks</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── CTA SECTION ──
function CTASection() {
  const addToast = useToastStore((s) => s.addToast);
  const [form, setForm] = useState({ firstName: '', lastName: '', company: '', industry: '', role: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authService.demoRequest(form);
      addToast('Demo request submitted! We\'ll be in touch within 24 hours.', 'success');
      setForm({ firstName: '', lastName: '', company: '', industry: '', role: '', email: '', phone: '' });
    } catch {
      addToast('Request submitted. We\'ll be in touch shortly!', 'success');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="cta" className="py-24 px-12 bg-dark2">
      <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 gap-20 items-center">
        <div>
          <Eyebrow text="Get Started" />
          <h2 className="font-display text-[46px] font-bold text-white leading-tight tracking-[-0.5px] mb-4">
            Ready to transform your <em className="italic text-gold">supply chain?</em>
          </h2>
          <p className="font-body text-[19px] leading-[1.75] mb-8" style={{ color: 'rgba(245,242,236,0.6)' }}>
            Join enterprise supply chains across Pharma, F&B, and FMCG who trust Quantum Optimizer to drive efficiency, reduce waste, and ensure compliance.
          </p>
          <div className="space-y-4">
            {['14-day free pilot with your own data', 'Dedicated implementation support', 'No lock-in — full data export anytime'].map((b) => (
              <div key={b} className="flex items-center gap-3 font-ui text-sm" style={{ color: 'rgba(245,242,236,0.7)' }}>
                <span className="text-gold">✓</span>
                {b}
              </div>
            ))}
          </div>
        </div>

        <div className="border border-gold/20 rounded-[10px] p-8" style={{ background: 'rgba(184,146,42,0.08)' }}>
          <h3 className="font-display text-[18px] font-bold text-white mb-6">Request a Demo</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {['firstName', 'lastName'].map((f) => (
                <input key={f} required value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                  placeholder={f === 'firstName' ? 'First Name' : 'Last Name'}
                  className="bg-white/7 border border-white/12 text-white placeholder-white/30 px-4 py-3 rounded-[4px] font-ui text-sm focus:outline-none focus:border-gold/50 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)', color: 'white' }} />
              ))}
            </div>
            <input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Company" className="w-full px-4 py-3 rounded-[4px] font-ui text-sm focus:outline-none focus:border-gold/50 transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }} />
            <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className="w-full px-4 py-3 rounded-[4px] font-ui text-sm focus:outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.12)', color: form.industry ? 'white' : 'rgba(245,242,236,0.3)' }}>
              <option value="" style={{ background: '#2c2c22' }}>Industry</option>
              {['Pharmaceutical', 'Food & Beverage', 'FMCG', 'Other'].map(o => <option key={o} value={o} style={{ background: '#2c2c22' }}>{o}</option>)}
            </select>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-3 rounded-[4px] font-ui text-sm focus:outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: form.role ? 'white' : 'rgba(245,242,236,0.3)' }}>
              <option value="" style={{ background: '#2c2c22' }}>Role</option>
              {['Supply Planner', 'Operations Director', 'CTO/CIO', 'Finance', 'Other'].map(o => <option key={o} value={o} style={{ background: '#2c2c22' }}>{o}</option>)}
            </select>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Work Email" className="w-full px-4 py-3 rounded-[4px] font-ui text-sm focus:outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }} />
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone (optional)" className="w-full px-4 py-3 rounded-[4px] font-ui text-sm focus:outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }} />
            <button type="submit" disabled={submitting}
              className="w-full bg-gold hover:bg-gold2 text-white font-ui text-[11px] font-bold uppercase tracking-[0.14em] py-3.5 rounded-[4px] transition-all mt-1">
              {submitting ? 'Submitting...' : 'Request a Demo'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

// ── FOOTER ──
function Footer() {
  return (
    <footer className="bg-dark py-8 px-12 border-t border-white/8">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-ui text-sm font-medium text-muted2">
          Forge <span className="text-gold">Quantum</span> Solution — Quantum Optimizer
        </div>
        <div className="font-ui text-xs text-muted">
          © {new Date().getFullYear()} Forge Quantum Solutions. All rights reserved.
        </div>
        <div className="flex gap-6">
          {['Privacy Policy', 'Terms of Service'].map((l) => (
            <a key={l} href="#" className="font-ui text-xs text-muted hover:text-gold transition-colors">{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── MAIN PAGE ──
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <Hero />
      <KPIStrip />
      <FeaturesSection />
      <HowItWorksSection />
      <ComplianceSection />
      <RolesSection />
      <IndustriesSection />
      <IntegrationsSection />
      <CTASection />
      <Footer />
      <ToastContainer />
    </div>
  );
}
