// guidHER — public landing page + auth gate.
// Views: 'landing' | 'login' | 'signup'
// Safety Map removed. BR-001/002 compliant copy throughout.
import { useState } from 'react';
import { Navigation, Flag, Lightbulb, Shield, Users, Train, Footprints, ChevronRight, Moon, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/authContext.jsx';

// ── Owly SVG ─────────────────────────────────────────────────────────────────
function OwlySVG({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 320 340" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M100 60C100 30 128 10 160 10C192 10 220 30 220 60L228 200C228 250 198 280 160 280C122 280 92 250 92 200L100 60Z" fill="#7D5CC7"/>
      <path d="M85 55C70 45 55 55 60 75C68 95 90 100 100 85" fill="#4B2E83"/>
      <path d="M235 55C250 45 265 55 260 75C252 95 230 100 220 85" fill="#4B2E83"/>
      <path d="M115 22C105 8 118 -5 135 5C145 12 148 25 140 34Z" fill="#4B2E83"/>
      <path d="M205 22C215 8 202 -5 185 5C175 12 172 25 180 34Z" fill="#4B2E83"/>
      <ellipse cx="160" cy="150" rx="62" ry="70" fill="#FFF9EF"/>
      <circle cx="134" cy="145" r="26" fill="#FFFFFF" stroke="#4B2E83" strokeWidth="3"/>
      <circle cx="186" cy="145" r="26" fill="#FFFFFF" stroke="#4B2E83" strokeWidth="3"/>
      <circle cx="134" cy="148" r="12" fill="#2C1B47"/>
      <circle cx="186" cy="148" r="12" fill="#2C1B47"/>
      <circle cx="130" cy="143" r="4" fill="#fff"/>
      <circle cx="182" cy="143" r="4" fill="#fff"/>
      <path d="M155 165L160 178L165 165" fill="#FFC857" stroke="#FFC857" strokeWidth="4" strokeLinejoin="round"/>
      <path d="M70 170C55 190 55 225 75 245C90 258 100 240 95 220L100 180Z" fill="#7D5CC7"/>
      <path d="M250 170C265 190 265 225 245 245C230 258 220 240 225 220L220 180Z" fill="#7D5CC7"/>
      <rect x="120" y="190" width="80" height="55" rx="16" fill="#4B2E83" opacity="0.9"/>
      <circle cx="160" cy="210" r="13" fill="#FFF9EF"/>
      <path d="M160 202L163 209L170 210L164 214L166 221L160 217L154 221L156 214L150 210L157 209Z" fill="#F28DBB"/>
    </svg>
  );
}

// ── Brand mark ───────────────────────────────────────────────────────────────
function BrandMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="30" cy="30" r="30" fill="#4B2E83"/>
      <path d="M18 24C18 18 23 14 30 14C37 14 42 18 42 24V32C42 38 37 42 30 42C23 42 18 38 18 32V24Z" fill="#B69AD9"/>
      <circle cx="24" cy="26" r="4.5" fill="#FFF9EF"/>
      <circle cx="36" cy="26" r="4.5" fill="#FFF9EF"/>
      <circle cx="24" cy="26" r="2" fill="#2C1B47"/>
      <circle cx="36" cy="26" r="2" fill="#2C1B47"/>
      <path d="M28 32L30 35L32 32" stroke="#FFC857" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// ── Static data ───────────────────────────────────────────────────────────────
const CAMPUSES = ['PUP Main Campus', 'PUP Sta. Mesa', 'Other'];
const COMMUTE_PREFS = [
  { id: 'lrt',     label: 'LRT commuter',    Icon: Train },
  { id: 'jeepney', label: 'Jeepney commuter', Icon: ChevronRight },
  { id: 'walking', label: 'Walking routes',   Icon: Footprints },
  { id: 'night',   label: 'Night commute',    Icon: Moon },
];

const FEATURES = [
  { Icon: Navigation, color: '#E4F5EC', iconColor: '#3FA772', title: 'Route Recommendations',   body: 'Get ranked routes from PUP to your destination, scored by safety conditions tonight.' },
  { Icon: Flag,       color: '#FDEBF2', iconColor: '#c2185b', title: 'Community Reporting',      body: 'Flag poor lighting, empty jeepneys, or recent incidents in under 20 seconds.' },
  { Icon: Lightbulb, color: '#FFF3D9', iconColor: '#f57f17', title: 'Safety Tips',               body: 'Zone-specific tips from riders who actually use these routes every day.' },
  { Icon: Shield,     color: '#EFE7F8', iconColor: '#7D5CC7', title: 'Conditions-Only Data',     body: 'We describe observable states — lighting, crowds, incidents — never crime labels.' },
  { Icon: Users,      color: '#E4F5EC', iconColor: '#3FA772', title: 'Community-Powered',        body: 'Every flag is something a real rider submitted. No guesswork, no police blotter.' },
  { Icon: Moon,       color: '#EFE7F8', iconColor: '#4B2E83', title: 'Night Commute Focus',      body: 'Built for the hours when the commute actually feels uncertain — not just daytime.' },
];

const TEAM = [
  { name: 'Maria Santos', role: 'Lead Developer',  initials: 'MS' },
  { name: 'Ana Reyes',    role: 'UX Designer',     initials: 'AR' },
  { name: 'Lea Cruz',     role: 'Community Lead',  initials: 'LC' },
  { name: 'Sofia Lim',    role: 'Data & Safety',   initials: 'SL' },
];

const ZONE_PREVIEW = [
  ['Teresa Street',    'red',    'Low light'],
  ['Pureza Station',   'yellow', 'Moderate'],
  ['Legarda approach', 'red',    'Low light'],
  ['Magsaysay Blvd',  'yellow', 'Half-empty units'],
  ['SM Sta. Mesa',     'green',  'Well-lit'],
];

// ── Landing nav ───────────────────────────────────────────────────────────────
function LandingNav({ onLogin, onSignup }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,249,239,0.93)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(75,46,131,0.08)' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandMark size={34} />
          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: '1.25rem', color: '#4B2E83' }}>
            guid<span style={{ color: '#F28DBB' }}>HER</span>
          </span>
        </div>
        <nav className="desktop-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#community">Community</a>
          <a href="#team">About</a>
        </nav>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
            guid<span style={{ color: '#F28DBB' }}>HER</span>
          </div>
          <div className="auth-logo-tagline">Wise. Watchful. With you.</div>
        </div>
        <div className="owly-wrap" style={{ margin: '12px 0' }}>
          <OwlySVG size={72} />
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
            guid<span style={{ color: '#F28DBB' }}>HER</span>
          </div>
        </div>
        {step === 1 ? (
          <>
            <div className="owly-wrap" style={{ margin: '8px 0 14px' }}>
              <OwlySVG size={60} />
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
  return (
    <div className="landing">
      <LandingNav onLogin={onLogin} onSignup={onSignup} />

      {/* ── Hero ── */}
      <section style={{ padding: '72px 0 56px' }} id="home">
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px' }}>
          <div className="hero-grid">
            <div>
              <span className="eyebrow">Sta. Mesa commute zone · PUP</span>
              <h1 className="hero-h1">
                Know your route.<br /><span className="accent">Own</span> your night.
              </h1>
              <p className="hero-lead">
                guidHER structures the safety knowledge PUP women already share with each other —
                which street, which exit, which hour — into a tool you can check before you even leave.
              </p>
              <div className="hero-ctas">
                <button className="btn btn-primary" onClick={onSignup}>
                  <Users size={17} /> Join guidHER
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
                <OwlySVG size={260} />
                <div className="owl-caption">
                  <b>Meet Owly</b>
                  <span>Wise, watchful, with you — your guidHER companion.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="land-section land-band-tint" id="features">
        <div className="land-section-inner">
          <div className="land-section-head">
            <span className="land-tag">What guidHER does</span>
            <h2 className="land-h2">Everything you need for a safer commute</h2>
            <p className="land-lead">Built around what riders actually need — not a crime dashboard, not an emergency hotline. Just clear, actionable commute conditions.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map(({ Icon, color, iconColor, title, body }) => (
              <div key={title} className="feature-card">
                <div className="feature-icon" style={{ background: color }}>
                  <Icon size={22} color={iconColor} />
                </div>
                <div className="feature-title">{title}</div>
                <p className="feature-body">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="land-section" id="how-it-works">
        <div className="land-section-inner">
          <div className="land-section-head">
            <span className="land-tag">How it works</span>
            <h2 className="land-h2">Three steps to a safer commute</h2>
            <p className="land-lead">guidHER is built around the commute decision moment — not a realtime tracker, not an SOS tool. Just clear conditions before you leave.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {[
              { n: '01', title: 'Check tonight\'s conditions', body: 'See what riders flagged on each segment of the Sta. Mesa zone — lighting, crowd levels, and recent incidents.' },
              { n: '02', title: 'Pick your safest route',       body: 'Routes are ranked by condition scores. Choose the one that avoids flagged segments, or the most direct if all is clear.' },
              { n: '03', title: 'Share what you notice',        body: 'See something off on your commute? Flag it in 20 seconds. Your report helps the next rider make a better call.' },
            ].map(({ n, title, body }) => (
              <div key={n} className="feature-card" style={{ borderTop: '3px solid var(--secondary)' }}>
                <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: '2rem', fontWeight: 800, color: 'var(--lavender)', marginBottom: 12, lineHeight: 1 }}>{n}</div>
                <div className="feature-title">{title}</div>
                <p className="feature-body">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Zone overview preview (no interactive map — just static data) ── */}
      <section className="land-section land-band-tint" id="zone-preview">
        <div className="land-section-inner">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 32, alignItems: 'center' }}>
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
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', background: 'var(--primary)', color: '#fff' }}>
                <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: '0.95rem' }}>Zone overview tonight</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.75, marginTop: 2 }}>Sta. Mesa commute zone</div>
              </div>
              {ZONE_PREVIEW.map(([loc, level, label]) => (
                <div key={loc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--line)', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{loc}</span>
                  <span className={`status-badge badge-${level}`}>{label}</span>
                </div>
              ))}
              <div style={{ padding: '12px 20px', fontSize: '0.75rem', color: 'var(--muted)' }}>
                Conditions only — no crime labels (BR-001)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Community CTA ── */}
      <section className="land-section land-band-cream" id="community">
        <div className="land-section-inner">
          <div className="cta-banner">
            <div>
              <h3>Built by students navigating this exact commute, for the next one behind them.</h3>
              <p>Join guidHER — your reports become someone else's peace of mind on the walk home.</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                <button className="btn btn-gold" onClick={onSignup}>
                  <Users size={16} /> Join the community
                </button>
                <button className="btn" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)' }} onClick={onLogin}>
                  Already a member? Log in
                </button>
              </div>
            </div>
            <OwlySVG size={140} />
          </div>
        </div>
      </section>

      {/* ── Built by / Team ── */}
      <section className="land-section" id="team">
        <div className="land-section-inner">
          <div className="land-section-head">
            <span className="land-tag">The team</span>
            <h2 className="land-h2">Built by PUP, for PUP</h2>
            <p className="land-lead">guidHER is a student-built prototype for the SparkFest innovation challenge. Made with care for the women who navigate Sta. Mesa every day.</p>
          </div>
          <div className="team-grid">
            {TEAM.map(({ name, role, initials }) => (
              <div key={name} className="team-card">
                <div className="team-avatar">{initials}</div>
                <div className="team-name">{name}</div>
                <div className="team-role">{role}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, padding: '16px 20px', background: 'var(--surface)', borderRadius: 14, fontSize: '0.875rem', color: 'var(--muted)' }}>
            Polytechnic University of the Philippines · Sta. Mesa, Manila · SparkFest 2026
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="land-footer">
        <div className="land-footer-inner">
          <div className="land-foot-grid">
            <div className="land-foot-brand">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BrandMark size={30} />
                <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#4B2E83' }}>
                  guid<span style={{ color: '#F28DBB' }}>HER</span>
                </span>
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
            <span>© 2026 guidHER — prototype for the Sta. Mesa commute zone</span>
            <span>Made for PUP women, by design</span>
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
