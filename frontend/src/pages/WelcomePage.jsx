// guidHER — public landing page + auth gate.
// Views: 'landing' | 'login' | 'signup'
// Safety Map removed. BR-001/002 compliant copy throughout.
import { useState } from 'react';
import { Users, Train, Footprints, ChevronRight, Moon, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/authContext.jsx';
import Owly from '../components/Owly.jsx';
import BrandMark from '../components/BrandMark.jsx';
import useRevealOnScroll from '../lib/useRevealOnScroll.js';

// ── Static data ───────────────────────────────────────────────────────────────
const CAMPUSES = ['PUP Main Campus', 'PUP Sta. Mesa', 'Other'];
const COMMUTE_PREFS = [
  { id: 'lrt',     label: 'LRT commuter',    Icon: Train },
  { id: 'jeepney', label: 'Jeepney commuter', Icon: ChevronRight },
  { id: 'walking', label: 'Walking routes',   Icon: Footprints },
  { id: 'night',   label: 'Night commute',    Icon: Moon },
];

const FEATURES = [
  { title: 'Zone Safety Map',       body: 'See every flagged segment of the Sta. Mesa zone live — tap any flag for its condition, severity, and exact report time.' },
  { title: 'Route Recommendations', body: 'Get 2–3 ranked routes to your destination, scored by tonight\'s real reported conditions.' },
  { title: 'AI Route Check',        body: 'Ask "Is my route okay tonight?" and get a Gemini-written verdict grounded only in real reports near your path.' },
  { title: 'Community Reporting',   body: 'Flag poor lighting, thin crowds, or a recent incident, with a required note and an optional photo.' },
  { title: 'Risk Summary',          body: 'A segment with several reports gets a clean, deduplicated AI summary instead of a wall of raw notes.' },
  { title: 'Incident Heatmap',      body: 'Toggle a density overlay of validated reports to see where risk clusters across the zone at a glance.' },
  { title: 'Safety Tips',           body: 'Zone-specific guidance for before, during, and after your commute — plus transport-specific advice.' },
  { title: 'Conditions-Only Data',  body: 'We describe observable states — lighting, crowds, incidents — never crime labels or place ratings.' },
  { title: 'Emergency Contacts',    body: 'Save trusted contacts on your profile so they\'re one tap away if you ever need them.' },
];

const ZONE_PREVIEW = [
  ['Teresa Street',    'red',    'Low light'],
  ['Pureza Station',   'yellow', 'Moderate'],
  ['Legarda approach', 'red',    'Low light'],
  ['Magsaysay Blvd',  'yellow', 'Half-empty units'],
  ['SM Sta. Mesa',     'green',  'Well-lit'],
];

// ── Brand wordmark ────────────────────────────────────────────────────────────
function BrandWordmark() {
  return <span className="brand-wordmark">Guid<span className="accent">Her</span></span>;
}

// ── Landing nav ───────────────────────────────────────────────────────────────
function LandingNav({ onLogin, onSignup }) {
  return (
    <div className="landing-nav">
      <div className="landing-nav-inner">
        <div className="landing-nav-left">
          <div className="landing-nav-brand">
            <BrandMark size={34} />
            <BrandWordmark />
          </div>
          <nav className="desktop-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#community">Community</a>
          </nav>
        </div>
        <div className="landing-nav-actions">
          <button className="btn btn-secondary btn-sm" onClick={onLogin}>Log In</button>
          <button className="btn btn-primary btn-sm" onClick={onSignup}>Sign Up</button>
        </div>
      </div>
    </div>
  );
}

// ── Login form ────────────────────────────────────────────────────────────────
function LoginView({ onBack, onDone, onSignup }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) { setErr('Please enter your email.'); return; }
    setBusy(true); setErr('');
    try { await login({ email, password }); onDone(); }
    catch (ex) { setErr(ex.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <BrandMark size={44} />
          <div className="auth-logo-text" style={{ marginTop: 10 }}>
            Guid<span className="text-pink">Her</span>
          </div>
          <div className="auth-logo-tagline">Wise. Watchful. With you.</div>
        </div>
        <div className="owly-wrap" style={{ margin: '12px 0' }}>
          <Owly size={72} pose="welcome" />
          <p className="owly-msg">Welcome back — your route is waiting.</p>
        </div>
        <h2 className="auth-title">Log in</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="l-email">Email</label>
            <input id="l-email" type="email" className="form-input" placeholder="you@email.com"
              value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="l-pw">Password</label>
            <input id="l-pw" type="password" className="form-input" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: '0.875rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              Remember me
            </label>
            <span className="auth-link">Forgot password?</span>
          </div>
          {err && <p className="status-err" style={{ marginBottom: 12 }}>{err}</p>}
          <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
            {busy ? <span className="spinner" /> : 'Log In'}
          </button>
        </form>
        <p className="auth-footer">No account? <span className="auth-link" onClick={onSignup}>Sign up</span></p>
        <p style={{ textAlign: 'center', marginTop: 8 }}>
          <span className="auth-link" style={{ fontSize: '0.8rem' }} onClick={onBack}>← Back to home</span>
        </p>
      </div>
    </div>
  );
}

// ── Signup form ───────────────────────────────────────────────────────────────
function SignupView({ onBack, onDone, onLogin }) {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', campus: 'PUP Main Campus', commutePrefs: [] });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function togglePref(id) {
    set('commutePrefs', form.commutePrefs.includes(id)
      ? form.commutePrefs.filter(p => p !== id)
      : [...form.commutePrefs, id]);
  }

  function nextStep(e) {
    e.preventDefault();
    if (!form.name.trim()) { setErr('Name is required.'); return; }
    if (!form.email.trim()) { setErr('Email is required.'); return; }
    if (form.password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirm) { setErr('Passwords do not match.'); return; }
    setErr(''); setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await register({ name: form.name, email: form.email, campus: form.campus, commutePrefs: form.commutePrefs }); onDone(); }
    catch (ex) { setErr(ex.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <BrandMark size={40} />
          <div className="auth-logo-text" style={{ marginTop: 8 }}>
            Guid<span className="text-pink">Her</span>
          </div>
        </div>
        {step === 1 ? (
          <>
            <div className="owly-wrap" style={{ margin: '8px 0 14px' }}>
              <Owly size={60} pose="cheering" />
              <p className="owly-msg">Let's get you set up for safer commutes.</p>
            </div>
            <h2 className="auth-title">Create account</h2>
            <form onSubmit={nextStep}>
              <div className="form-group">
                <label className="form-label" htmlFor="su-name">Full name</label>
                <input id="su-name" type="text" className="form-input" placeholder="Maria Santos"
                  value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="su-email">Email</label>
                <input id="su-email" type="email" className="form-input" placeholder="you@pup.edu.ph"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="su-pw">Password</label>
                <input id="su-pw" type="password" className="form-input" placeholder="Min. 6 characters"
                  value={form.password} onChange={e => set('password', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="su-confirm">Confirm password</label>
                <input id="su-confirm" type="password" className="form-input" placeholder="Repeat password"
                  value={form.confirm} onChange={e => set('confirm', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="su-campus">Campus</label>
                <select id="su-campus" className="form-input" value={form.campus} onChange={e => set('campus', e.target.value)}>
                  {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {err && <p className="status-err" style={{ marginBottom: 12 }}>{err}</p>}
              <button type="submit" className="btn btn-primary btn-full">
                Next — Commute preferences <ArrowRight size={16} />
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="auth-title">How do you commute?</h2>
            <p className="auth-subtitle">Choose all that apply. We'll personalise your route view.</p>
            <form onSubmit={handleSubmit}>
              <div className="pref-chips" style={{ marginBottom: 24 }}>
                {COMMUTE_PREFS.map(({ id, label, Icon }) => (
                  <button type="button" key={id}
                    className={`pref-chip${form.commutePrefs.includes(id) ? ' selected' : ''}`}
                    onClick={() => togglePref(id)}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
              {err && <p className="status-err" style={{ marginBottom: 12 }}>{err}</p>}
              <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
                {busy ? <span className="spinner" /> : 'Create Account'}
              </button>
              <button type="button" className="btn btn-ghost btn-full mt-12" onClick={() => setStep(1)}>Back</button>
            </form>
          </>
        )}
        <p className="auth-footer">
          Already have an account? <span className="auth-link" onClick={onLogin}>Log in</span>
        </p>
        <p style={{ textAlign: 'center', marginTop: 6 }}>
          <span className="auth-link" style={{ fontSize: '0.8rem' }} onClick={onBack}>← Back to home</span>
        </p>
      </div>
    </div>
  );
}

// ── Full landing page ─────────────────────────────────────────────────────────
function LandingPage({ onLogin, onSignup }) {
  const heroRef = useRevealOnScroll();
  const featuresRef = useRevealOnScroll();
  const howItWorksRef = useRevealOnScroll();
  const zonePreviewRef = useRevealOnScroll();
  const communityRef = useRevealOnScroll();

  return (
    <div className="landing">
      <LandingNav onLogin={onLogin} onSignup={onSignup} />

      {/* ── Hero ── */}
      <section className="hero-section" id="home" ref={heroRef}>
        <div className="hero-grid">
          <div>
            <span className="eyebrow">Sta. Mesa commute zone · PUP</span>
            <h1 className="hero-h1">
              Know your route.<br /><span className="accent">Own</span> your night.
            </h1>
            <p className="hero-lead">
              GuidHer structures the safety knowledge PUP women already share with each other —
              which street, which exit, which hour — into a tool you can check before you even leave.
            </p>
            <div className="hero-ctas">
              <button className="btn btn-primary" onClick={onSignup}>
                <Users size={17} /> Join GuidHer
              </button>
              <button className="btn btn-secondary" onClick={onLogin}>
                Log in to your account
              </button>
            </div>
            <div className="hero-stats">
              <div className="hero-stat"><b>412</b><span>reports this month</span></div>
              <div className="hero-stat"><b>8</b><span>zone segments tracked</span></div>
              <div className="hero-stat"><b>3,140</b><span>community members</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="mascot-halo" />
            <div className="mascot-card">
              <div className="speech-bubble">Teresa St. is clear right now</div>
              <Owly size={260} pose="welcome" className="owly-float" />
              <div className="owl-caption">
                <b>Meet Owly</b>
                <span>Wise, watchful, with you — your GuidHer companion.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="land-section land-band-tint" id="features" ref={featuresRef}>
        <div className="land-section-inner">
          <div className="land-section-head">
            <span className="land-tag">What GuidHer does</span>
            <h2 className="land-h2">Everything you need for a safer commute</h2>
            <p className="land-lead">Built around what riders actually need — not a crime dashboard, not an emergency hotline. Just clear, actionable commute conditions.</p>
          </div>
          <div className="feature-index">
            {FEATURES.map(({ title, body }) => (
              <div key={title} className="feature-index-item">
                <span className="owl-eyes" aria-hidden="true"><span /><span /></span>
                <div className="feature-index-text">
                  <div className="feature-index-title">{title}</div>
                  <p className="feature-index-body">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="land-section" id="how-it-works" ref={howItWorksRef}>
        <div className="land-section-inner">
          <div className="land-section-head">
            <span className="land-tag">How it works</span>
            <h2 className="land-h2">Three steps to a safer commute</h2>
            <p className="land-lead">GuidHer is built around the commute decision moment — not a realtime tracker, not an SOS tool. Just clear conditions before you leave.</p>
          </div>
          <div className="how-it-works-grid">
            {[
              { n: '01', title: 'Check tonight\'s conditions', body: 'See what riders flagged on each segment of the Sta. Mesa zone — lighting, crowd levels, and recent incidents.' },
              { n: '02', title: 'Pick your safest route',       body: 'Routes are ranked by condition scores. Choose the one that avoids flagged segments, or the most direct if all is clear.' },
              { n: '03', title: 'Share what you notice',        body: 'See something off on your commute? Flag it in 20 seconds. Your report helps the next rider make a better call.' },
            ].map(({ n, title, body }) => (
              <div key={n} className="feature-card step-card">
                <div className="step-number">{n}</div>
                <div className="feature-title">{title}</div>
                <p className="feature-body">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Zone overview preview (no interactive map — just static data) ── */}
      <section className="land-section land-band-tint" id="zone-preview" ref={zonePreviewRef}>
        <div className="land-section-inner">
          <div className="zone-preview-grid">
            <div>
              <span className="land-tag">Zone data, tonight</span>
              <h2 className="land-h2">See what riders are saying right now</h2>
              <p className="land-lead" style={{ marginBottom: 20 }}>
                Conditions are submitted by commuters in the zone. Every flag describes an observable state — lighting, crowd level, or a recent incident — never a crime label.
              </p>
              <button className="btn btn-primary" onClick={onSignup}>
                <ArrowRight size={16} /> Sign up to see full conditions
              </button>
            </div>
            <div className="card zone-preview-card">
              <div className="zone-preview-head">
                <div className="zone-preview-title">Zone overview tonight</div>
                <div className="zone-preview-head-sub">Sta. Mesa commute zone</div>
              </div>
              {ZONE_PREVIEW.map(([loc, level, label]) => (
                <div key={loc} className="zone-preview-row">
                  <span>{loc}</span>
                  <span className={`status-badge badge-${level}`}>{label}</span>
                </div>
              ))}
              <div className="zone-preview-foot">
                Conditions only — no crime labels (BR-001)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Community CTA ── */}
      <section className="land-section land-band-cream" id="community" ref={communityRef}>
        <div className="land-section-inner">
          <div className="cta-banner">
            <div>
              <h3>Built by students navigating this exact commute, for the next one behind them.</h3>
              <p>Join GuidHer — your reports become someone else's peace of mind on the walk home.</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                <button className="btn btn-gold" onClick={onSignup}>
                  <Users size={16} /> Join the community
                </button>
                <button className="btn btn-cta-ghost" onClick={onLogin}>
                  Already a member? Log in
                </button>
              </div>
            </div>
            <Owly size={140} pose="shareandhelp" />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="land-footer">
        <div className="land-footer-inner">
          <div className="land-foot-grid">
            <div className="land-foot-brand">
              <div className="land-foot-brand-row">
                <BrandMark size={30} />
                <BrandWordmark />
              </div>
              <p>Wise. Watchful. With you. A safer-commute guide for women navigating the Sta. Mesa zone.</p>
            </div>
            <div className="land-foot-cols">
              <div className="land-foot-col">
                <h5>Platform</h5>
                <a href="#features">Features</a>
                <a href="#how-it-works">How it works</a>
                <a href="#community">Community</a>
              </div>
              <div className="land-foot-col">
                <h5>Legal</h5>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Contact us</a>
              </div>
            </div>
          </div>
          <div className="land-foot-bottom">
            <span>© 2026 GuidHer — prototype for the Sta. Mesa commute zone</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────
export default function WelcomePage({ onEnter }) {
  const [view, setView] = useState('landing');
  const { login } = useAuth();

  async function handleGuest() {
    await login({ email: 'guest@guidher.app' });
    onEnter();
  }

  if (view === 'login')  return <LoginView  onBack={() => setView('landing')} onDone={onEnter} onSignup={() => setView('signup')} />;
  if (view === 'signup') return <SignupView onBack={() => setView('landing')} onDone={onEnter} onLogin={() => setView('login')} />;
  return <LandingPage onLogin={() => setView('login')} onSignup={() => setView('signup')} />;
}
